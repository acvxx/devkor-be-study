export class PostListResponseDto {
  id: number;
  title: string;
  content: string;
  writer: string;
  date: Date;

  view: number;
  like: number;
  comment: number;
}

export class PagedPostListDto {
  posts: PostListResponseDto[];
  page: number;
  totalPage: number;
  totalPost: number;
}
