import { isAdmin, unauthorized, badRequest } from "@/lib/admin-guard";
import { sendEmail } from "@/lib/send-email";
import {
  welcomeEmail,
  newFollowerEmail,
  friendRequestEmail,
  friendAcceptedEmail,
  newMessageEmail,
  newCommentEmail,
  commentReplyEmail,
  postReactionEmail,
  projectUpdateEmail,
  projectCompleteEmail,
  okmadeAnnouncementEmail,
  passwordChangedEmail,
} from "@/lib/email-templates";
import { logActivity } from "@/lib/admin-auth";

const TEMPLATES = {
  welcome: () => welcomeEmail({ username: "testuser", displayName: "Test User" }),
  newFollower: () => newFollowerEmail({ followerName: "Test Follower", followerUsername: "follower1" }),
  friendRequest: () => friendRequestEmail({ senderName: "Sender", senderUsername: "sender1" }),
  friendAccepted: () => friendAcceptedEmail({ accepterName: "Accepter", accepterUsername: "accepter1" }),
  newMessage: () => newMessageEmail({ senderName: "Sender", senderUsername: "sender1", preview: "Hello, this is a test message.", threadId: "test123" }),
  newComment: () => newCommentEmail({ commenterName: "Commenter", commenterUsername: "commenter1", preview: "Nice post!", postId: "test123" }),
  commentReply: () => commentReplyEmail({ replierName: "Replier", replierUsername: "replier1", preview: "Thanks!", postId: "test123" }),
  postReaction: () => postReactionEmail({ reactorName: "Reactor", reactionType: "like", postId: "test123" }),
  projectUpdate: () => projectUpdateEmail({ projectTitle: "Test Project", description: "Some progress", tokenString: "TESTTOKEN" }),
  projectComplete: () => projectCompleteEmail({ projectTitle: "Test Project", tokenString: "TESTTOKEN" }),
  okmadeAnnouncement: () => okmadeAnnouncementEmail({ title: "Test Announcement", body: "This is a test.", ctaUrl: "https://okmade.vercel.app" }),
  passwordChanged: () => passwordChangedEmail({ username: "testuser" }),
};

export async function POST(request) {
  if (!(await isAdmin(request))) return unauthorized();
  const { to, template } = await request.json();
  if (!to || !template) return badRequest("to and template required");
  if (!TEMPLATES[template]) return badRequest("Unknown template");

  const tpl = TEMPLATES[template]();
  const result = await sendEmail({ to, subject: tpl.subject, html: tpl.html });

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error }), { status: 500 });
  }
  await logActivity({ action: "test_email_sent", target_type: "email", details: { to, template } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
