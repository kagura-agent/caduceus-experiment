// Tests for the blog platform services
// Run: node test/run.js

const { UserService } = require('../src/user-service');
const { PostService } = require('../src/post-service');
const { CommentService } = require('../src/comment-service');
const { NotificationService } = require('../src/notification-service');

let passed = 0, failed = 0;

function assert(condition, name) {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}`); failed++; }
}

function assertEq(a, b, name) {
  assert(a === b, `${name} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);
}

// --- UserService ---
console.log('UserService:');
const users = new UserService();
const u1 = users.create({ name: 'Alice <script>', email: 'ALICE@Example.COM', bio: 'Hello & "world"' });
assert(!u1.error, 'create user');
assertEq(u1.user.name, 'Alice &lt;script&gt;', 'name sanitized');
assertEq(u1.user.email, 'alice@example.com', 'email lowercased');
assertEq(u1.user.bio, 'Hello &amp; &quot;world&quot;', 'bio sanitized');
assert(u1.user.createdAt && u1.user.createdAt.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/), 'timestamp formatted');

const u1dup = users.create({ name: 'Bob', email: 'alice@example.com' });
assert(u1dup.error === 'Email already exists', 'reject duplicate email');

const u2 = users.create({ name: 'Bob', email: 'bob@example.com' });
assert(!u2.error, 'create second user');

const updateResult = users.update(u1.user.id, { name: 'Alice Updated' });
assert(!updateResult.error, 'update user');
assertEq(updateResult.user.name, 'Alice Updated', 'name updated');

// --- PostService ---
console.log('\nPostService:');
const posts = new PostService(users);
const p1 = posts.create({ title: 'Hello World!', body: 'My first post <b>bold</b>', authorId: u1.user.id, tags: ['intro', 'test'] });
assert(!p1.error, 'create post');
assertEq(p1.post.slug, 'hello-world', 'slug generated');
assertEq(p1.post.authorName, 'Alice Updated', 'author name populated');
assert(p1.post.tags.length === 2, 'tags preserved');

const p1bySlug = posts.getBySlug('hello-world');
assert(p1bySlug && p1bySlug.id === p1.post.id, 'get by slug');

const p2 = posts.create({ title: 'Second Post', body: 'More content', authorId: u2.user.id });
assert(!p2.error, 'create post by second user');

const authorPosts = posts.listByAuthor(u1.user.id);
assertEq(authorPosts.total, 1, 'list by author filters correctly');

// --- CommentService ---
console.log('\nCommentService:');
const comments = new CommentService(users, posts);
const c1 = comments.create({ body: 'Great post!', authorId: u2.user.id, postId: p1.post.id });
assert(!c1.error, 'create comment');
assertEq(c1.comment.authorName, 'Bob', 'comment author name');

const c2 = comments.create({ body: 'Thanks!', authorId: u1.user.id, postId: p1.post.id, parentId: c1.comment.id });
assert(!c2.error, 'create reply');
assertEq(c2.comment.parentId, c1.comment.id, 'reply parent set');

const replies = comments.getReplies(c1.comment.id);
assertEq(replies.length, 1, 'getReplies returns 1');

const topLevel = comments.listByPost(p1.post.id);
assertEq(topLevel.total, 1, 'listByPost returns only top-level');

const crossPostReply = comments.create({ body: 'Nope', authorId: u1.user.id, postId: p2.post.id, parentId: c1.comment.id });
assert(crossPostReply.error === 'Parent comment belongs to different post', 'reject cross-post reply');

const threadCount = comments.getThreadCount(p1.post.id);
assertEq(threadCount, 2, 'thread count includes replies');

// Delete with cascade
const delResult = comments.delete(c1.comment.id);
assert(delResult.success, 'delete comment');
assertEq(delResult.deletedCount, 2, 'cascade deletes replies');

// --- NotificationService ---
console.log('\nNotificationService:');
const notifs = new NotificationService();
notifs.subscribe(u1.user.id, 'alice@example.com', { comments: true, replies: true });
notifs.subscribe(u2.user.id, 'bob@example.com', { comments: false });

const n1 = notifs.notify('comments', { message: 'New comment on your post', recipientId: u1.user.id, senderId: u2.user.id, postId: p1.post.id });
assert(n1.delivered, 'notification delivered');

const n2 = notifs.notify('comments', { message: 'New comment', recipientId: u2.user.id, senderId: u1.user.id });
assert(n2.skipped, 'notification skipped (comments disabled)');

const unread = notifs.getForUser(u1.user.id, { unreadOnly: true });
assertEq(unread.length, 1, 'one unread notification');

notifs.markRead(n1.notification.id);
const afterMark = notifs.getForUser(u1.user.id, { unreadOnly: true });
assertEq(afterMark.length, 0, 'no unread after markRead');

// --- Cross-service integration ---
console.log('\nIntegration:');
const badPost = posts.create({ title: 'Ghost', authorId: 999 });
assert(badPost.error === 'Author not found', 'post rejects invalid author');

const badComment = comments.create({ body: 'Hi', authorId: u1.user.id, postId: 999 });
assert(badComment.error === 'Post not found', 'comment rejects invalid post');

users.delete(u2.user.id);
assert(!users.getById(u2.user.id), 'user deleted');

// --- Summary ---
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
