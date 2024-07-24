/* 
def osu_string(self, username: str, rank: int) -> str:
        if self.mode > Mode.MANIA:
            score = int(self.pp)
        else:
            score = self.score

        return (
            f"{self.id}|{username}|{score}|{self.max_combo}|{self.n50}|{self.n100}|{self.n300}|{self.nmiss}|"
            f"{self.nkatu}|{self.ngeki}|{int(self.full_combo)}|{int(self.mods)}|{self.user_id}|{rank}|{self.time}|"
            "1"  # has replay
        )
*/

export interface LeaderboardScore {
    id: number;
    displayedUsername: string;
    displayedScore: number;
    max_combo: number;
    count_50: number;
    count_100: number;
    count_300: number;
    count_miss: number;
    count_katu: number;
    count_geki: number;
    full_combo: boolean;
    mods: number;
    user_id: number;
    rank: number;
    time: number;
    has_replay: boolean;
}


export class LeaderboardRepository {
    
}
