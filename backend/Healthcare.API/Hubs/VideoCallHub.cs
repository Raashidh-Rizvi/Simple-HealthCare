using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Healthcare.API.Hubs
{
    public class VideoCallHub : Hub
    {
        public async Task JoinCall(string callId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, callId);
            await Clients.OthersInGroup(callId).SendAsync("PeerJoined", Context.ConnectionId);
        }

        public async Task LeaveCall(string callId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, callId);
            await Clients.OthersInGroup(callId).SendAsync("PeerLeft", Context.ConnectionId);
        }

        public async Task SendOffer(string callId, string offer)
        {
            await Clients.OthersInGroup(callId).SendAsync("ReceiveOffer", Context.ConnectionId, offer);
        }

        public async Task SendAnswer(string callId, string answer)
        {
            await Clients.OthersInGroup(callId).SendAsync("ReceiveAnswer", Context.ConnectionId, answer);
        }

        public async Task SendIceCandidate(string callId, string candidate)
        {
            await Clients.OthersInGroup(callId).SendAsync("ReceiveIceCandidate", Context.ConnectionId, candidate);
        }
    }
}
