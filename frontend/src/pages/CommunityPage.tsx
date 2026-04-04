import { useEffect, useState } from "react";
import axios from "axios";
import { communityApi } from "../api/api";
import PageHeader from "../components/layout/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../context/ToastContext";

export default function CommunityPage() {
  const { pushToast } = useToast();
  const [posts, setPosts] = useState<
    { id: string; athlete: string; role: string; content: string; metric: string; likes: number }[]
  >([]);
  const [postText, setPostText] = useState("");

  useEffect(() => {
    async function loadCommunityPosts() {
      try {
        const response = await communityApi.list();
        setPosts(
          response.data.map((entry: { id: string; athlete: string; content: string; likes: number }) => ({
            id: entry.id,
            athlete: entry.athlete,
            role: "Athlete",
            content: entry.content,
            metric: "Community update",
            likes: entry.likes,
          }))
        );
      } catch (error) {
        if (!axios.isAxiosError(error)) {
          console.error(error);
        }
      }
    }

    void loadCommunityPosts();
  }, []);

  async function handleShareProgress() {
    if (!postText.trim()) {
      pushToast("Write a short progress update before sharing.", "error");
      return;
    }

    const response = await communityApi.create({
      athleteId: "ath-1",
      athlete: "Jordan Lee",
      content: postText,
    });

    setPosts((current) => [
      {
        id: response.data.id,
        athlete: response.data.athlete,
        role: "Athlete",
        content: response.data.content,
        metric: "Community update",
        likes: response.data.likes,
      },
      ...current,
    ]);
    setPostText("");
    pushToast("Progress shared with the community.", "success");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Athlete community"
        title="Celebrate progress, follow athletes, and share the work behind your best performances."
        description="Profiles, achievements, weekly challenges, badges, and community updates keep motivation high across the platform."
        badge="Weekly challenge live"
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_0.78fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-app-text">Community feed</h3>
            <Button variant="ghost" type="button" onClick={handleShareProgress} disabled={!postText.trim()}>
              Share progress
            </Button>
          </div>
          <div className="mt-4">
            <Input placeholder="Share a win, PR, or lesson from training..." value={postText} onChange={(event) => setPostText(event.target.value)} />
          </div>
          <div className="mt-5 grid gap-4">
            {posts.length === 0 ? (
              <div className="rounded-3xl bg-app-surface-strong p-5 text-sm text-app-text-soft">
                No community posts yet. Share your first update to start the feed.
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="rounded-3xl bg-app-surface-strong p-5">
                  <p className="text-sm text-app-text-soft">
                    {post.athlete} · {post.role}
                  </p>
                  <p className="mt-3 text-base leading-7 text-app-text">{post.content}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold text-app-accent-strong">{post.metric}</span>
                    <span className="text-app-text-soft">{post.likes} likes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card>
            <h3 className="text-xl font-semibold text-app-text">Badges and streaks</h3>
            <div className="mt-5 rounded-2xl border border-app-border bg-app-surface-strong p-4 text-sm text-app-text-soft">
              No badges yet. Achievements will unlock as you train, log sessions, and stay consistent.
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold text-app-text">Leaderboard</h3>
            <div className="mt-5 rounded-2xl bg-app-surface-strong px-4 py-4 text-sm text-app-text-soft">
              Leaderboards will appear once athletes start posting progress and completing challenges.
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
