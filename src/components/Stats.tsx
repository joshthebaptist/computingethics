import type { Store } from '../types';
import { deckStats, last14Days, overallCounts, retention, streaks } from '../stats';

interface Props {
  store: Store;
  onDeleteDeck: (deck: string) => void;
}

export default function Stats({ store, onDeleteDeck }: Props) {
  const counts = overallCounts(store);
  const { current, best } = streaks(store.logs);
  const { rate, reviewed } = retention(store.logs);
  const days = last14Days(store.logs);
  const decks = deckStats(store.cards);
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="stats-wrap">
      <div className="stat-grid">
        <div className="panel stat-card">
          <span className="stat-label">Current streak</span>
          <span className="stat-value">🔥 {current}</span>
          <span className="stat-sub">days · best {best}</span>
        </div>
        <div className="panel stat-card">
          <span className="stat-label">Recall rate</span>
          <span className="stat-value">{rate}%</span>
          <span className="stat-sub">over {reviewed} mature reviews</span>
        </div>
        <div className="panel stat-card">
          <span className="stat-label">Due today</span>
          <span className="stat-value">{counts.due}</span>
          <span className="stat-sub">{counts.reviewsToday} reviews logged today</span>
        </div>
        <div className="panel stat-card">
          <span className="stat-label">Collection</span>
          <span className="stat-value">{counts.total}</span>
          <span className="stat-sub">
            {counts.newCards} new · {counts.learning} learning · {counts.mature} mature
          </span>
        </div>
      </div>

      <div className="panel">
        <h2>Reviews — last 14 days</h2>
        <div className="bar-chart">
          {days.map((d) => (
            <div className="bar-col" key={d.day} title={`${d.day}: ${d.count}`}>
              <div className="bar" style={{ height: `${(d.count / maxDay) * 100}%` }} />
              <span className="bar-label">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="hint">{counts.reviews} lifetime reviews · short daily sessions beat cramming.</p>
      </div>

      <div className="panel">
        <h2>Decks</h2>
        {decks.length === 0 ? (
          <p className="hint">No decks yet.</p>
        ) : (
          <table className="deck-table">
            <thead>
              <tr>
                <th>Deck</th>
                <th>Cards</th>
                <th>Due</th>
                <th>New</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {decks.map((d) => (
                <tr key={d.deck}>
                  <td>{d.deck}</td>
                  <td>{d.total}</td>
                  <td>{d.due}</td>
                  <td>{d.fresh}</td>
                  <td>
                    <button className="btn btn-ghost btn-mini" onClick={() => onDeleteDeck(d.deck)}>
                      delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
