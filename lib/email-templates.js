const LOGO_URL = "https://okmade.vercel.app/favicon.ico";
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://okmade.vercel.app";

function wrapper({ heading, bodyHtml, ctaText, ctaUrl, footerNote }) {
  const cta = ctaText && ctaUrl
    ? `<div style="text-align:center;margin:30px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#D97706;color:#ffffff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:15px;">${ctaText}</a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#FFFBEB;padding:40px 20px;margin:0;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:40px 30px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="${LOGO_URL}" alt="OKMADE" width="60" height="60" style="display:inline-block;">
      <h1 style="color:#92400E;font-size:22px;margin:8px 0 0 0;">OKMADE</h1>
      <p style="color:#B45309;font-size:11px;margin:4px 0 0 0;letter-spacing:2px;">TRUST THE PROGRESS</p>
    </div>

    <h2 style="color:#1F2937;font-size:20px;margin:0 0 12px 0;">${heading}</h2>
    <div style="color:#4B5563;font-size:15px;line-height:1.6;">${bodyHtml}</div>

    ${cta}

    ${footerNote ? `<p style="color:#6B7280;font-size:13px;margin-top:20px;">${footerNote}</p>` : ""}

    <div style="border-top:1px solid #E5E7EB;margin-top:30px;padding-top:20px;text-align:center;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">© 2026 OKMADE Furniture &amp; Interiors</p>
      <p style="color:#9CA3AF;font-size:11px;margin:6px 0 0 0;">
        <a href="${SITE_URL}" style="color:#D97706;text-decoration:none;">Visit site</a> ·
        <a href="${SITE_URL}/client/settings" style="color:#D97706;text-decoration:none;">Manage emails</a>
      </p>
    </div>
  </div>
</body></html>`;
}

export function welcomeEmail({ username, displayName }) {
  return {
    subject: "Welcome to OKMADE 🎉",
    html: wrapper({
      heading: `Welcome, ${displayName || username}!`,
      bodyHtml: `<p>Your OKMADE account is now active. You can:</p>
        <ul style="padding-left:20px;">
          <li>Follow artisans and see their latest work</li>
          <li>Post updates on your profile</li>
          <li>Chat with other artisans</li>
          <li>Track your custom projects</li>
        </ul>`,
      ctaText: "Open My Dashboard",
      ctaUrl: `${SITE_URL}/client/dashboard`,
    }),
  };
}

export function newFollowerEmail({ followerName, followerUsername }) {
  return {
    subject: `${followerName} is now following you on OKMADE`,
    html: wrapper({
      heading: "You have a new follower!",
      bodyHtml: `<p><strong>${followerName}</strong> (@${followerUsername}) just followed you. They'll see your future posts in their feed.</p>`,
      ctaText: "View Their Profile",
      ctaUrl: `${SITE_URL}/client/${followerUsername}`,
    }),
  };
}

export function friendRequestEmail({ senderName, senderUsername }) {
  return {
    subject: `${senderName} wants to be friends on OKMADE`,
    html: wrapper({
      heading: "New Friend Request",
      bodyHtml: `<p><strong>${senderName}</strong> (@${senderUsername}) sent you a friend request. Accept to start chatting and see their private posts.</p>`,
      ctaText: "Review Request",
      ctaUrl: `${SITE_URL}/client/dashboard`,
    }),
  };
}

export function friendAcceptedEmail({ accepterName, accepterUsername }) {
  return {
    subject: `${accepterName} accepted your friend request`,
    html: wrapper({
      heading: "You're now friends!",
      bodyHtml: `<p><strong>${accepterName}</strong> (@${accepterUsername}) accepted your friend request. You can now message each other directly.</p>`,
      ctaText: "Send a Message",
      ctaUrl: `${SITE_URL}/client/${accepterUsername}`,
    }),
  };
}

export function newMessageEmail({ senderName, senderUsername, preview, threadId }) {
  return {
    subject: `New message from ${senderName}`,
    html: wrapper({
      heading: "You have a new message",
      bodyHtml: `<p><strong>${senderName}</strong> sent you a message:</p>
        <blockquote style="border-left:3px solid #D97706;padding-left:12px;color:#6B7280;font-style:italic;margin:12px 0;">${preview}</blockquote>`,
      ctaText: "Read & Reply",
      ctaUrl: `${SITE_URL}/client/messages/${threadId}`,
    }),
  };
}

export function newCommentEmail({ commenterName, commenterUsername, preview, postId }) {
  return {
    subject: `${commenterName} commented on your post`,
    html: wrapper({
      heading: "New comment on your post",
      bodyHtml: `<p><strong>${commenterName}</strong> commented:</p>
        <blockquote style="border-left:3px solid #D97706;padding-left:12px;color:#6B7280;font-style:italic;margin:12px 0;">${preview}</blockquote>`,
      ctaText: "View Post",
      ctaUrl: `${SITE_URL}/client/posts/${postId}`,
    }),
  };
}

export function commentReplyEmail({ replierName, replierUsername, preview, postId }) {
  return {
    subject: `${replierName} replied to your comment`,
    html: wrapper({
      heading: "Someone replied to your comment",
      bodyHtml: `<p><strong>${replierName}</strong> replied:</p>
        <blockquote style="border-left:3px solid #D97706;padding-left:12px;color:#6B7280;font-style:italic;margin:12px 0;">${preview}</blockquote>`,
      ctaText: "View Conversation",
      ctaUrl: `${SITE_URL}/client/posts/${postId}`,
    }),
  };
}

export function postReactionEmail({ reactorName, reactionType, postId }) {
  const label = { like: "👍 liked", love: "❤️ loved", haha: "😂 laughed at", wow: "😮 reacted to", sad: "😢 reacted to", angry: "😡 reacted to" }[reactionType] || "reacted to";
  return {
    subject: `${reactorName} ${label} your post`,
    html: wrapper({
      heading: "New reaction on your post",
      bodyHtml: `<p><strong>${reactorName}</strong> ${label} your post.</p>`,
      ctaText: "View Post",
      ctaUrl: `${SITE_URL}/client/posts/${postId}`,
    }),
  };
}

export function projectUpdateEmail({ projectTitle, description, tokenString }) {
  return {
    subject: `Project update: ${projectTitle}`,
    html: wrapper({
      heading: "New Progress Update",
      bodyHtml: `<p>Your project <strong>${projectTitle}</strong> has been updated.</p>
        ${description ? `<p style="color:#6B7280;">${description}</p>` : ""}`,
      ctaText: "See Progress",
      ctaUrl: `${SITE_URL}/workspace/${tokenString}`,
    }),
  };
}

export function projectCompleteEmail({ projectTitle, tokenString }) {
  return {
    subject: `Your project "${projectTitle}" is complete ✅`,
    html: wrapper({
      heading: "Work Completed!",
      bodyHtml: `<p>Your custom piece <strong>${projectTitle}</strong> is finished and ready. Thank you for choosing OKMADE.</p>`,
      ctaText: "View Final Result",
      ctaUrl: `${SITE_URL}/workspace/${tokenString}`,
    }),
  };
}

export function okmadeAnnouncementEmail({ title, body, ctaUrl }) {
  return {
    subject: `OKMADE: ${title}`,
    html: wrapper({
      heading: title,
      bodyHtml: `<p>${body}</p>`,
      ctaText: "See Details",
      ctaUrl: ctaUrl || SITE_URL,
    }),
  };
}

export function passwordChangedEmail({ username }) {
  return {
    subject: "Your OKMADE password was changed",
    html: wrapper({
      heading: "Password Changed",
      bodyHtml: `<p>Hi ${username}, your OKMADE account password was just changed.</p>
        <p style="color:#DC2626;"><strong>If this wasn't you</strong>, reset your password immediately.</p>`,
      ctaText: "Reset Password Now",
      ctaUrl: `${SITE_URL}/client/forgot-password`,
    }),
  };
}
