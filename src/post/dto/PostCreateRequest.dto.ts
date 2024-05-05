import { IsString } from 'class-validator';

export class PostCreateRequest {
  @IsString()
  title: string;

  @IsString()
  content: string;
}
