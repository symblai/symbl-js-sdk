/*  Bookmark Create/Update and Delete Models
interface BookmarkCreateRequest {
  type: "bookmark_request";
  operation: "create";
  label?: string;
  description?: string;
  user: BookmarkUser;
  beginTimeOffset: number;
  duration: number;
}

interface BookmarkUpdateRequest {
  type: "bookmark_request";
  operation: "update";
  id?: string;
  label?: string;
  description?: string;
  user: BookmarkUser;
  beginTimeOffset: number;
  duration: number;
}

interface BookmarkDeleteRequest {
  type: "bookmark_request";
  operation: "delete";
  id?: string;
}
*/

interface BookmarkUser {
  name?: string;
  userId?: string;
  email?: string;
}

interface BookmarkResponse {
  type: string;
  operation: string;
  id?: string;
  label?: string;
  description?: string;
  user: BookmarkUser;
  beginTimeOffset: number;
  duration: number;
}

export { BookmarkUser, BookmarkResponse };
