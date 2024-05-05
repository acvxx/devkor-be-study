export class CommentResponseDto {
  id: number;
  content: string;
  writer: string;
  date: Date;
  reply?: number;
}
