import { useEffect, useRef, useState } from "react";
import CallScreen from "./CallScreen";
import { io } from "socket.io-client";

import {
  Home as HomeIcon,
  Phone,
  Users,
  Sparkles,
  MessageCircle,
  Settings,
  Search,
  Bell,
  Video,
  ArrowRight,
  MoreVertical,
  UserPlus,
} from "lucide-react";

function Home() {

  const socketRef = useRef(null);

if (!socketRef.current) {
  socketRef.current = io("http://localhost:3001");
}

const socket = socketRef.current;
  
  const [activePage, setActivePage] = useState("Home");
  const [search, setSearch] = useState("");
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("Rohan Verma");
  const [selectedChat, setSelectedChat] = useState("Ananya Sharma");
  const [chatRoom, setChatRoom] = useState("FRENZO-CHAT");
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("join-room", chatRoom);
  
    socket.on("receive-message", ({ message }) => {
      setMessages((prev) => [
        ...prev,
        {
          text: message,
          sender: "friend",
        },
      ]);
    });
  
    socket.on("friend-typing", () => {
      console.log("⌨️ FRIEND IS TYPING");
    
      setIsTyping(true);
    
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    });
    return () => {
      socket.off("receive-message");
      socket.off("friend-typing");
    };
  }, [chatRoom]);

  

  const friends = [
    {
      name: "Ananya Sharma",
      status: "Online",
      message: "Ready to catch up! 💗",
      color: "green",
      avatar: "👩🏻",
    },
    {
      name: "Rohan Verma",
      status: "Away",
      message: "Be right back 👋",
      color: "orange",
      avatar: "👨🏻",
    },
    {
      name: "Meera Singh",
      status: "Offline",
      message: "Last seen yesterday",
      color: "gray",
      avatar: "👩🏻",
    },
  ];

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(search.toLowerCase())
  );

  // Start a call with selected friend
  const startCall = (friendName) => {
    setSelectedFriend(friendName);
    setShowCallScreen(true);
  };

  // End call
  const endCall = () => {
    setShowCallScreen(false);
  };

  const sendMessage = () => {
    if (!messageText.trim()) {
      return;
    }
  
    setMessages((prev) => [
      ...prev,
      {
        text: messageText,
        sender: "me",
      },
    ]);
  
    socket.emit("send-message", {
      roomId: chatRoom,
      message: messageText,
    });
      
  
    setMessageText("");
  };

  // Show CallScreen
  if (showCallScreen) {
    return (
      <CallScreen
  friendName={selectedFriend}
  onEndCall={endCall}
  isHost={true}
/>
    );
  }

  return (
    <div className="frenzo-layout">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo">
          <span>♡</span>
          <h1>Frenzo</h1>
        </div>

        <nav>

          {/* HOME */}
          <button
            className={`nav-item ${
              activePage === "Home" ? "active" : ""
            }`}
            onClick={() => setActivePage("Home")}
          >
            <HomeIcon size={20} />
            Home
          </button>

          {/* CALLS */}
          <button
            className={`nav-item ${
              activePage === "Calls" ? "active" : ""
            }`}
            onClick={() => setActivePage("Calls")}
          >
            <Phone size={20} />
            Calls
          </button>

          {/* FRIENDS */}
          <button
            className={`nav-item ${
              activePage === "Friends" ? "active" : ""
            }`}
            onClick={() => setActivePage("Friends")}
          >
            <Users size={20} />
            Friends
          </button>

          {/* MOMENTS */}
          <button
            className={`nav-item ${
              activePage === "Moments" ? "active" : ""
            }`}
            onClick={() => setActivePage("Moments")}
          >
            <Sparkles size={20} />
            Moments
          </button>

          {/* CHATS */}
          <button
            className={`nav-item ${
              activePage === "Chats" ? "active" : ""
            }`}
            onClick={() => setActivePage("Chats")}
          >
            <MessageCircle size={20} />
            Chats
          </button>

          {/* SETTINGS */}
          <button
            className={`nav-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={20} />
            Settings
          </button>

        </nav>

        <div className="sidebar-note">
          <div className="note-face">☺</div>

          <p>
            good vibes
            <br />
            only ♡
          </p>
        </div>

      </aside>


      {/* ================= MAIN CONTENT ================= */}

      <main className="main-content">

        {/* TOP BAR */}

        <header className="topbar">

          <div className="search-box">

            <Search size={18} />

            <input
              placeholder="Search friends, chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>


          <div className="profile-area">

            <div className="notification">
              <Bell size={21} />
              <span>3</span>
            </div>

            <div className="profile">

              <div className="profile-avatar">
                👩🏻
              </div>

              <div>
                <strong>Sejal Shah</strong>
                <small>Be kind, always 💗</small>
              </div>

            </div>

          </div>

        </header>


        {/* ================= FRIENDS PAGE ================= */}

        {activePage === "Friends" ? (

          <section className="friends-page">

            <h1>Your Friends 👥</h1>

            <p>
              Find your friends and start connecting.
            </p>


            <div className="friends-page-list">

              {filteredFriends.map((friend) => (

                <div
                  className="friend-row"
                  key={friend.name}
                >

                  <div className="friend-avatar">

                    {friend.avatar}

                    <span
                      className={`status-dot ${friend.color}`}
                    ></span>

                  </div>


                  <div className="friend-info">

                    <h3>
                      {friend.name}
                    </h3>

                    <span
                      className={`status ${friend.color}`}
                    >
                      {friend.status}
                    </span>

                  </div>


                  <p>
                    {friend.message}
                  </p>


                  {/* MESSAGE BUTTON */}

                  <button className="message-btn">
                    <MessageCircle size={19} />
                  </button>


                  {/* VIDEO BUTTON */}

                  <button
                    className="video-btn"
                    onClick={() =>
                      startCall(friend.name)
                    }
                  >
                    <Video size={19} />
                  </button>

                </div>

              ))}

            </div>

          </section>


        ) : activePage === "Home" ? (

          /* ================= HOME PAGE ================= */

          <>

            {/* HERO */}

            <section className="hero">

              <div className="hero-text">

                <h2>
                  Hey Sejal <span>♡</span>
                </h2>

                <h3>
                  Good people. Great vibes.
                </h3>

                <p>
                  Let's make some amazing memories! ✨
                </p>

                <div className="online-pill">

                  <span></span>

                  Online & ready to connect

                </div>

              </div>


              <div className="hero-cards">

                <div className="person-card pink">

                  <div className="person">
                    👩🏻
                  </div>

                  <span>✌️</span>

                </div>


                <div className="person-card green">

                  <div className="person">
                    👨🏻
                  </div>

                  <span>👋</span>

                </div>

              </div>

            </section>


            {/* START CALL */}

            {/* ================= QUICK ACTIONS ================= */}

<section className="quick-actions-section">

<div className="section-title">
  <h2>Quick Actions</h2>
</div>

<div className="quick-actions">

  {/* VIDEO CALL */}
  <button
    className="quick-action video-action"
    onClick={() => startCall("Rohan Verma")}
  >
    <div className="quick-icon">
      <Video size={23} />
    </div>

    <div>
      <strong>Video Call</strong>
      <span>Talk face-to-face</span>
    </div>

    <ArrowRight size={18} />
  </button>


  {/* VOICE CALL */}
  <button
    className="quick-action voice-action"
    onClick={() => {
      console.log("Voice call coming next");
    }}
  >
    <div className="quick-icon">
      <Phone size={23} />
    </div>

    <div>
      <strong>Voice Call</strong>
      <span>Just a voice away</span>
    </div>

    <ArrowRight size={18} />
  </button>


  {/* NEW CHAT */}
  <button
    className="quick-action chat-action"
    onClick={() => {
      setActivePage("Chats");
    }}
  >
    <div className="quick-icon">
      <MessageCircle size={23} />
    </div>

    <div>
      <strong>New Chat</strong>
      <span>Send a message</span>
    </div>

    <ArrowRight size={18} />
  </button>


  {/* ADD FRIEND */}
  <button
    className="quick-action friend-action"
    onClick={() => {
      setActivePage("Friends");
    }}
  >
    <div className="quick-icon">
      <UserPlus size={23} />
    </div>

    <div>
      <strong>Add Friend</strong>
      <span>Grow your circle</span>
    </div>

    <ArrowRight size={18} />
  </button>

</div>

</section>


            {/* FRIENDS */}

            {/* ================= ONLINE FRIENDS ================= */}

<section className="online-friends-section">

<div className="section-title">
  <h2>Online Friends</h2>

  <button
    onClick={() => setActivePage("Friends")}
  >
    See all →
  </button>
</div>

<div className="online-friends-list">

  {/* ADD FRIEND */}
  <button
    className="online-friend add-friend-circle"
    onClick={() => setActivePage("Friends")}
  >
    <div className="online-avatar add-avatar">
      +
    </div>

    <strong>Add Friend</strong>
  </button>


  {filteredFriends.map((friend) => (

    <div
      className="online-friend"
      key={friend.name}
    >

      <div className="online-avatar">

        {friend.name.charAt(0)}

        <span
          className={`online-status ${friend.color}`}
        ></span>

      </div>

      <strong>
        {friend.name.split(" ")[0]}
      </strong>

      <small>
        {friend.status}
      </small>

    </div>

  ))}

</div>

</section>

{/* ================= RECENT CHATS ================= */}

<section className="recent-chats-section">

  <div className="section-title">
    <h2>Recent Chats</h2>

    <button onClick={() => setActivePage("Chats")}>
      See all →
    </button>
  </div>

  <div className="recent-chats-list">

    <button
      className="chat-item"
      onClick={() => setActivePage("Chats")}
    >
      <div className="chat-avatar pink-avatar">
        A
        <span className="chat-online"></span>
      </div>

      <div className="chat-info">
        <strong>Ananya Sharma</strong>
        <span>Ready to catch up! 💗</span>
      </div>

      <div className="chat-time">
        2m
      </div>
    </button>

    <button
      className="chat-item"
      onClick={() => setActivePage("Chats")}
    >
      <div className="chat-avatar green-avatar">
        R
      </div>

      <div className="chat-info">
        <strong>Rohan Verma</strong>
        <span>Be right back 👋</span>
      </div>

      <div className="chat-time">
        18m
      </div>
    </button>

    <button
      className="chat-item"
      onClick={() => setActivePage("Chats")}
    >
      <div className="chat-avatar beige-avatar">
        M
      </div>

      <div className="chat-info">
        <strong>Meera Singh</strong>
        <span>Last seen yesterday</span>
      </div>

      <div className="chat-time">
        Yesterday
      </div>
    </button>

  </div>

</section>


</>

      ) : (

          /* ================= OTHER PAGES ================= */

          <section className="chat-page">

  <div className="chat-sidebar">

    <div className="chat-header">
      <div>
        <h2>Chats</h2>
        <span>Your conversations</span>
      </div>

      <button className="new-chat-button">
        +
      </button>
    </div>

    <div className="chat-search">
      <Search size={17} />
      <input
        type="text"
        placeholder="Search chats..."
      />
    </div>

    <div className="chat-list">

    <button
  className="chat-list-item active"
  onClick={() => setSelectedChat("Ananya Sharma")}>

        <div className="chat-avatar pink-avatar">
          A
          <span className="chat-online"></span>
        </div>

        <div className="chat-list-info">
          <strong>Ananya Sharma</strong>
          <span>Ready to catch up! 💗</span>
        </div>

        <small>2m</small>

      </button>

      <button
  className="chat-list-item"
  onClick={() => setSelectedChat("Rohan Verma")}
>

        <div className="chat-avatar green-avatar">
          R
        </div>

        <div className="chat-list-info">
          <strong>Rohan Verma</strong>
          <span>Be right back 👋</span>
        </div>

        <small>18m</small>

      </button>

      <button
  className="chat-list-item"
  onClick={() => setSelectedChat("Meera Singh")}
  
>

        <div className="chat-avatar beige-avatar">
          M
        </div>

        <div className="chat-list-info">
          <strong>Meera Singh</strong>
          <span>Last seen yesterday</span>
        </div>

        <small>Yesterday</small>

      </button>

    </div>

  </div>


  <div className="chat-conversation">

  {/* CHAT HEADER */}

  <div className="conversation-header">

    <div className="conversation-user">

      <div className="chat-avatar pink-avatar">
        {selectedChat.charAt(0)}
        <span className="chat-online"></span>
      </div>

      <div>
  <strong>{selectedChat}</strong>

  {isTyping ? (
  <span className="typing-header">
    typing...
  </span>
) : (
  <span>Online</span>
)}
  
</div>

    </div>

    <div className="conversation-actions">

      <button>
        <Phone size={19} />
      </button>

      <button>
        <Video size={19} />
      </button>

      <button>
        <MoreVertical size={19} />
      </button>

    </div>

  </div>


  {/* MESSAGES */}

  <div className="messages-area">

  <div className="message received">
    <span>Hey! 👋</span>
  </div>

  <div className="message received">
    <span>How are you? 💗</span>
  </div>

  <div className="message sent">
    <span>I'm good! What about you? 😊</span>
  </div>

  {messages.map((message, index) => (
    <div
      key={index}
      className={`message ${
        message.sender === "me"
          ? "sent"
          : "received"
      }`}
    >
      <span>{message.text}</span>
    </div>
  ))}



</div>


  {/* MESSAGE INPUT */}

  <div className="message-input-area">

    <button className="emoji-button">
      😊
    </button>

    <input
  type="text"
  placeholder={`Message ${selectedChat}...`}
  value={messageText}
  onChange={(e) => {
    setMessageText(e.target.value);
  
    socket.emit("typing", {
      roomId: chatRoom,
    });
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  }}
/>

<button
  className="send-button"
  onClick={sendMessage}
>
  <ArrowRight size={19} />
</button>

  </div>

</div>

</section>

        )}

      </main>


      {/* ================= RIGHT PANEL ================= */}

      <aside className="right-panel">

        {/* INVITE */}

        <div className="invite-card">

          <div className="invite-icon">
            <UserPlus size={25} />
          </div>

          <h2>
            Frenzo is better
            <br />
            with friends 💗
          </h2>

          <p>
            Add more friends and
            <br />
            start connecting!
          </p>

          <button>
            Invite Friends
            <UserPlus size={17} />
          </button>

        </div>


        {/* EXPRESS */}

        <div className="express-card">

          <Sparkles size={22} />

          <h2>
            Express yourself ✨
          </h2>

          <p>
            Try fun AR effects,
            <br />
            doodle in the air
            <br />
            and show your mood!
          </p>

          <button>
            Explore Now
          </button>

          <div className="express-person">
            😎
          </div>

        </div>


        {/* QUOTE */}

        <div className="quote-card">

          <span>“</span>

          <p>
            Surround yourself with
            <br />
            people who get you.
          </p>

          <strong>♡</strong>

        </div>

      </aside>

    </div>
  );
}

export default Home;