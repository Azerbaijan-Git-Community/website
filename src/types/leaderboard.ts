export interface Contributor {
  id: string;
  username: string;
  avatarUrl: string;
  monthlyCommits: number;
  totalCommits: number;
  joinedAt: string; // ISO date string
}
