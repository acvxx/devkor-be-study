import { CommentResponseDto } from './CommentResponse.dto';

export class PostInfoResponseDto {
  id: number;
  title: string;
  content: string;
  writer: string;
  date: Date;

  view: number;
  like: number;
  likedUser: string[];
  comments: CommentResponseDto[];
  replys: CommentResponseDto[];
}
