import {useCallback, useEffect, useRef} from 'react';
import useStateWithCallback from './useStateWithCallback';
import freeice from 'freeice'; //free STUN servers
import socket from '../socket';
import ACTIONS from '../socket/actions';

export const LOCAL_VIDEO = 'LOCAL_VIDEO';

const useWebRTC = roomID => {
  const [clients, setClients] = useStateWithCallback([]);

  const addNewClient = useCallback((newClient, cb) => {
    if (!clients.includes(newClient)) {
      setClients(list => [...list, newClient], cb);
    }
  }, [clients, setClients])

  const peerConnections = useRef({});
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL_VIDEO]: null
  });

  //1. Start my video in the room
  const startCapture = async () => {
    localMediaStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: 1280,
        height: 720,
      }
    })

    addNewClient(LOCAL_VIDEO, () => {
      const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

      if (localVideoElement) {
        localVideoElement.volume = 0;
        localVideoElement.srcObject = localMediaStream.current;
      }
    });
  }

  //2. add new peer and create an offer
  const handleNewPeer = async ({peerID, createOffer}) => {
    if (peerID in peerConnections.current) {
      return console.warn('Already connected' + peerID);
    }

    peerConnections.current[peerID] = new RTCPeerConnection({iceServers: freeice()});

    peerConnections.current[peerID].onicecandidate = event => {
      if (event.candidate) {
        socket.emit(ACTIONS.RELAY_ICE, {
          peerID,
          iceCandidate: event.candidate,
        })
      }
    }

    let tracksNumber = 0;
    peerConnections.current[peerID].ontrack = ({streams: [remoteStream]}) => {
      tracksNumber++;
      if (tracksNumber === 2) { //video & audio tracks received
        addNewClient(peerID, () => peerMediaElements.current[peerID].srcObject = remoteStream);
      }
    }

    localMediaStream.current.getTracks().forEach(track => peerConnections.current[peerID].addTrack(track, localMediaStream.current));

    if (createOffer) {
      const offer = await peerConnections.current[peerID].createOffer();
      await peerConnections.current[peerID].setLocalDescription(offer);

      socket.emit(ACTIONS.RELAY_SDP, {
        peerID,
        sessionDescription: offer
      })
    }
  }

  //3. accept an offer and create an answer
  const setRemoteMedia = async ({peerID, sessionDescription: remoteDescription}) => {
    console.log(remoteDescription, 'remoteDescription')
    await peerConnections.current[peerID]?.setRemoteDescription(new RTCSessionDescription(remoteDescription));

    if (remoteDescription.type === 'offer') {
      const answer = await peerConnections.current[peerID].createAnswer();
      await peerConnections.current[peerID].setLocalDescription(answer);
      socket.emit(ACTIONS.RELAY_SDP, {
        peerID,
        sessionDescription: answer,
      })
    }
  }

  //4. add new candidate
  const handleIceCandidate = ({peerID, iceCandidate}) => peerConnections.current[peerID]?.addIceCandidate(new RTCIceCandidate(iceCandidate));

  //5. remove this peer when we live the room
  const handleRemovePeer = ({peerID}) => {
    if (peerConnections.current[peerID]) {
      peerConnections.current[peerID].close();
    }

    delete peerConnections.current[peerID];
    delete peerMediaElements.current[peerID];

    setClients(list => list.filter(c => c !== peerID));
  };

  useEffect(() => {
    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
    socket.on(ACTIONS.ADD_PEER, handleNewPeer);
    socket.on(ACTIONS.ICE_CANDIDATE, handleIceCandidate);
    socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

    return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION);
      socket.off(ACTIONS.ADD_PEER);
      socket.off(ACTIONS.ICE_CANDIDATE);
      socket.off(ACTIONS.REMOVE_PEER);
    }
  }, []);

  useEffect(() => {
    startCapture().then(() => socket.emit(ACTIONS.JOIN, {room: roomID})).catch(e => console.error('Error getting userMedia:', e));

    return () => {
      localMediaStream.current.getTracks().forEach(track => track.stop());
      socket.emit(ACTIONS.LEAVE);
    }
  }, [roomID]);

  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, []);

  return {clients, provideMediaRef};
}

export default useWebRTC;