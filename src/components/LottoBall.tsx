import type { MatchResult } from '../types';
import { getBallStyle } from '../utils';
import { BallHoverTooltip } from './BallHoverTooltip';

interface LottoBallsProps {
  numbers: number[];
  matchResult?: MatchResult | null;
}

export function LottoBalls({ numbers, matchResult }: LottoBallsProps) {
  if (!numbers || (numbers.length !== 6 && numbers.length !== 7)) return null;
  const mainNumbers = numbers.slice(0, 6);
  const bonusNumber = numbers[6];

  return (
    <div className="lotto-balls-container">
      {mainNumbers.map((num, i) => {
        const isMatched = matchResult?.matchedNumbers.includes(num);
        const isBonusMatched =
          matchResult &&
          matchResult.winningNumbers.length === 7 &&
          matchResult.winningNumbers[6] === num;

        const opacity = matchResult
          ? isMatched || isBonusMatched
            ? 1
            : 0.35
          : 1;
        const border = isMatched
          ? '2px solid #ffffff'
          : isBonusMatched
            ? '2px solid #c084fc'
            : '1px solid rgba(255,255,255,0.15)';
        const scale = isMatched || isBonusMatched ? '1.1' : '1';
        return (
          <BallHoverTooltip key={i} ball={num}>
            <div
              className="lotto-ball"
              style={{
                ...getBallStyle(num),
                opacity,
                border,
                transform: `scale(${scale})`,
              }}
            >
              {num}
            </div>
          </BallHoverTooltip>
        );
      })}
      {numbers.length === 7 && (
        <>
          <div
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: 'var(--text-muted)',
              margin: '0 4px',
            }}
          >
            +
          </div>
          {(() => {
            const isBonusMatched = matchResult?.bonusMatch ?? false;
            const bonusOpacity = matchResult ? (isBonusMatched ? 1 : 0.35) : 1;
            const bonusBorder = isBonusMatched
              ? '2px solid #ffffff'
              : '1px solid rgba(255,255,255,0.15)';
            const bonusScale = isBonusMatched ? '1.1' : '1';
            return (
              <BallHoverTooltip ball={bonusNumber}>
                <div
                  className="lotto-ball"
                  style={{
                    ...getBallStyle(bonusNumber),
                    opacity: bonusOpacity,
                    border: bonusBorder,
                    transform: `scale(${bonusScale})`,
                  }}
                >
                  {bonusNumber}
                </div>
              </BallHoverTooltip>
            );
          })()}
        </>
      )}
    </div>
  );
}
