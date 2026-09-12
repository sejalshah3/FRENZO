import { useState } from "react";
import CallScreen from "./CallScreen";

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
  const [activePage, setActivePage] = useState("Home");
  const [search, setSearch] = useState("");
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("Rohan Verma");

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

  // Show CallScreen
  if (showCallScreen) {
    return (
      <CallScreen
        friendName={selectedFriend}
        onEndCall={endCall}
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

            <section className="call-card">

              <div className="call-icon">
                <Video size={34} />
              </div>


              <div className="call-text">

                <h2>
                  Start a Call
                </h2>

                <p>
                  Hop on a video call with
                  <br />
                  your friends instantly!
                </p>

              </div>


              <button
                className="start-button"
                onClick={() =>
                  startCall("Rohan Verma")
                }
              >

                Start Now

                <ArrowRight size={20} />

              </button>

            </section>


            {/* FRIENDS */}

            <section className="friends-section">

              <div className="section-title">

                <h2>
                  Your Friends
                </h2>

                <button
                  onClick={() =>
                    setActivePage("Friends")
                  }
                >
                  See all →
                </button>

              </div>


              <div className="friends-list">

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


                    {/* MESSAGE */}

                    <button className="message-btn">

                      <MessageCircle size={19} />

                    </button>


                    {/* VIDEO CALL */}

                    <button
                      className="video-btn"
                      onClick={() =>
                        startCall(friend.name)
                      }
                    >

                      <Video size={19} />

                    </button>


                    {/* MORE */}

                    <button className="more-btn">

                      <MoreVertical size={19} />

                    </button>

                  </div>

                ))}

              </div>

            </section>

          </>


        ) : (

          /* ================= OTHER PAGES ================= */

          <section className="friends-page">

            <h1>
              {activePage}
            </h1>

            <p>
              This page is coming next. ✨
            </p>

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