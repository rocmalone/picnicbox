import { useEffect, useState } from "react";

import { getCookie } from "../helpers";

import { useParams } from "react-router-dom";

import { io } from "socket.io-client";

import ErrorComponent from "../components/ErrorComponent";
import LeaderModeSelect from "../components/LeaderModeSelect";

const apiUrl = process.env.REACT_APP_BACKEND_URL;

let socket;

function Room(props) {
  // Only connect the socket when inside a room
  if (window.location.pathname.includes("/room/")) {
    // Connect to the server websocket
    socket = io(apiUrl, {
      reconnectionDelayMax: 10000,
    });
  }

  // Grab the roomCode from the react router path /room/:roomCode
  const { roomCode } = useParams();

  const [userID, setUserID] = useState("");

  const [isLeader, setIsLeader] = useState(false);

  const [users, setUsers] = useState([]);

  // Error message is tracked as state and displayed in the ErrorComponent
  const [errorText, setErrorText] = useState("");

  // On loading the page
  useEffect(() => {
    // Get the userID cookie
    try {
      setUserID(getCookie("userID"));
      setErrorText("");
    } catch (error) {
      setErrorText(
        "Could not find userID cookie." +
          " This website relies on same-site cookies (for gameplay, not tracking)." +
          " Please disable any extensions/browser features which may be blocking cookies."
      );
    }

    // Set up websocket connection
    socket.emit("sendUserInfo", { userID: userID, roomCode: roomCode });
  }, [userID, roomCode]);

  // Validate the roomcode when it is changed (incl. on initial page load)
  useEffect(() => {
    // REGEXP pattern: 4 characters, a-z and/or A-Z
    const pattern = /^[a-zA-Z]{4}$/;
    if (!pattern.test(roomCode)) {
      setErrorText(`${roomCode} is not a valid room code.`);
    }
  }, [roomCode]);

  // If we have an error, display it rather than rendering the page
  if (errorText) {
    return (
      <>
        <ErrorComponent text={errorText} />
      </>
    );
  }

  socket.io.on("error", (error) => {
    console.debug("Socket error:", error);
  });

  socket.on("hello", () => {
    console.debug("recieved hello ping");
  });

  // Ask/Tell who is the leader of the room.
  // If client is the leader, set isLeader = true
  socket.emit("askLeaderID", userID, roomCode);
  socket.on("tellLeaderID", (leaderID) => {
    if (leaderID === userID) {
      setIsLeader(true);
    } else if (isLeader) {
      setIsLeader(false);
    }
  });

  // socket.on("updateConnectedUsers", (userName) => {
  //   setUsers();
  // });

  // socket.on("userConnect", (userName) => {
  //   setUsers((prevArray) => [...prevArray, userName]);
  //   console.debug("User connected: ", userName);
  //   console.debug("Users:", users);
  // });

  // socket.on("userDisconnect", (dcUserName) => {
  //   const newUsers = users.filter((userName) => userName === dcUserName);
  //   setUsers([newUsers]);
  // });

  socket.on("updateUserNames", (userNamesArr) => {
    setUsers(userNamesArr);
    console.log("userNamesArray: ", userNamesArr);
    console.log("usersArray:", users);
  });

  return (
    <div>
      <div>
        Room Code is: {roomCode}, User ID is: {userID}
      </div>
      <LeaderModeSelect isLeader={isLeader} />
      <div>isLeader={isLeader}</div>
      <ul>
        {users.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <div className="promptWrapper">Prompt here</div>
      <div className="responseWrapper"></div>
      <button>test</button>
    </div>
  );
}

export default Room;
