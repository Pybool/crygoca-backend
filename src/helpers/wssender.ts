import utils from '../helpers/misc';

const socketMessangers = {
  sendPersonalWebscoketMessage: ((channelType:string,accountId:string,data:any)=>{
    try{
      if (channelType && data) {
        const socket = utils.userConnections.get([channelType,accountId].join('-'))
        if (socket) {
          const message = JSON.stringify({ type: channelType, data: data });
          socket.send(message);
        }
        else{
          console.log("User Websocket connection not found")
        }
      }
    }
    catch(error){
      throw error;
    }
  })
}

export default socketMessangers
