import React, { useEffect, useState } from "react";
import ApiConnector from "../../api/apiConnector";
import ApiEndpoints from "../../api/apiEndpoints";
import ServerUrl from "../../api/serverUrl";
import Constants from "../../lib/constants";
import SocketActions from "../../lib/socketActions";
import CommonUtil from "../../util/commonUtil";
import "./chatBodyStyle.css";

let socket = new WebSocket(
  ServerUrl.WS_BASE_URL + `ws/users/${CommonUtil.getUserId()}/chat/`
);
if (socket) {
  socket.onopen = (event) => {
    
  }
  socket.onclose = (event) => {
    localStorage.clear();
  }
}
let typingTimer = 0;
let isTypingSignalSent = false;

const ChatBody = ({ match, currentChattingMember, setOnlineUserList }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState({});
  const [typing, setTyping] = useState(false);

  const fetchChatMessage = async () => {
    const currentChatId = CommonUtil.getActiveChatId(match);
    if (currentChatId) {
      const url =
        ApiEndpoints.CHAT_MESSAGE_URL.replace(
          Constants.CHAT_ID_PLACE_HOLDER,
          currentChatId
        );
      const chatMessages = await ApiConnector.sendGetRequest(url);
      setMessages(chatMessages);
      console.log(chatMessages);
    }
  };

  useEffect(() => {
    fetchChatMessage();
  }, [CommonUtil.getActiveChatId(match)]);

  const loggedInUserId = CommonUtil.getUserId();
  const getChatMessageClassName = (userId) => {
    return loggedInUserId === userId
      ? "chat-message-right pb-3"
      : "chat-message-left pb-3";
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const chatId = CommonUtil.getActiveChatId(match);
    const userId = CommonUtil.getUserId();
    if (data.action === SocketActions.CHANNEL_LIST) {
      // Show Rooms in Side bar
      localStorage.setItem("channel_list", data.channel_list)
      data.channel_list.length && localStorage.setItem("channel_id", data.channel_list[0]["channel_id"]);
      console.log(data)
    }
    if (chatId == data.channel_id) {
      if (data.action === SocketActions.MESSAGE) {
        if (data.user_id != userId) {
          console.log(data);
        }
        // data["user_image"] = ServerUrl.BASE_URL.slice(0, -1) + data.user_image;
        // setMessages((prevState) => {
        //   let messagesState = JSON.parse(JSON.stringify(prevState));
        //   messagesState.results.unshift(data);
        //   return messagesState;
        // });
        setTyping(false);
        
      } else if (data.action === SocketActions.TYPING && data.user_id !== userId) {
        setTyping(data.typing);
        console.log(data)
      }
    }
  };

  const messageSubmitHandler = (event) => {
    event.preventDefault();
    if (inputMessage) {
      socket.send(
        JSON.stringify({
          action: SocketActions.MESSAGE,
          message: inputMessage,
          user_id: CommonUtil.getUserId(),
          channel_id: CommonUtil.getActiveChatId(match),
        })
      );
    }
    setInputMessage("");
  };

  const sendTypingSignal = (typing) => {
    socket.send(
      JSON.stringify({
        action: SocketActions.TYPING,
        typing: typing,
        user_id: CommonUtil.getUserId(),
        channel_id: CommonUtil.getActiveChatId(match),
      })
    );
  };

  const chatMessageTypingHandler = (event) => {
    if (event.keyCode !== Constants.ENTER_KEY_CODE) {
      if (!isTypingSignalSent) {
        sendTypingSignal(true);
        isTypingSignalSent = true;
      }
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        sendTypingSignal(false);
        isTypingSignalSent = false;
      }, 2000);
    } else {
      clearTimeout(typingTimer);
      isTypingSignalSent = false;
    }
  };

  return (
    <div className="col-12 col-sm-8 col-md-8 col-lg-8 col-xl-10 pl-0 pr-0">
      <div className="py-2 px-4 border-bottom d-none d-lg-block">
        <div className="d-flex align-items-center py-1">
          <div className="position-relative">
            <img
              src={currentChattingMember?.image}
              className="rounded-circle mr-1"
              alt="User"
              width="40"
              height="40"
            />
          </div>
          <div className="flex-grow-1 pl-3">
            <strong>{currentChattingMember?.name}</strong>
          </div>
        </div>
      </div>
      <div className="position-relative">
        <div
          id="chat-message-container"
          className="chat-messages pl-4 pt-4 pr-4 pb-1 d-flex flex-column-reverse"
        >
          {typing && (
            <div className="chat-message-left chat-bubble mb-1">
              <div className="typing">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
          {messages?.results?.map((message, index) => (
            <div key={index} className={getChatMessageClassName(message.user)}>
              <div>
                <img
                  src={message.userImage}
                  className="rounded-circle mr-1"
                  alt={message.userName}
                  width="40"
                  height="40"
                />
                <div className="text-muted small text-nowrap mt-2">
                  {CommonUtil.getTimeFromDate(message.timestamp)}
                </div>
              </div>
              <div className="flex-shrink-1 bg-light ml-1 rounded py-2 px-3 mr-3">
                <div className="font-weight-bold mb-1">{message.userName}</div>
                {message.message}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-grow-0 py-3 px-4 border-top">
        <form onSubmit={messageSubmitHandler}>
          <div className="input-group">
            <input
              onChange={(event) => setInputMessage(event.target.value)}
              onKeyUp={chatMessageTypingHandler}
              value={inputMessage}
              id="chat-message-input"
              type="text"
              className="form-control"
              placeholder="Type your message"
              autoComplete="off"
            />
            <button
              id="chat-message-submit"
              className="btn btn-outline-warning"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBody;
