import { Link, useParams } from 'react-router-dom';
import { getChallenge } from '@/features/challenges/registry';

export function ChallengeDetail() {
  const { slug } = useParams();
  const challenge = getChallenge(slug);

  if (!challenge) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <h1 className="text-xl font-semibold" data-testid="page-title">
          Challenge not found
        </h1>
        <p className="text-sm text-slate-500">No challenge matches “{slug}”.</p>
        <Link to="/challenges" className="btn-primary">
          Back to Challenge Lab
        </Link>
      </div>
    );
  }

  const { Component } = challenge;
  return <Component />;
}
