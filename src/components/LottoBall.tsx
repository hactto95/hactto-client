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

        const stateClass = matchResult
          ? isMatched
            ? 'scale-110 !border-2 !border-white opacity-100 ring-2 ring-primary-cyan/40'
            : isBonusMatched
              ? 'scale-110 !border-2 !border-purple-400 opacity-100'
              : 'scale-100 opacity-35'
          : 'scale-100 opacity-100';

        return (
          <BallHoverTooltip key={i} ball={num}>
            <div
              className={`lotto-ball ${stateClass}`}
              style={getBallStyle(num)}
            >
              {num}
            </div>
          </BallHoverTooltip>
        );
      })}
      {numbers.length === 7 && (
        <>
          <div className="mx-1 text-[1.2rem] font-bold text-muted">+</div>
          {(() => {
            const isBonusMatched = matchResult?.bonusMatch ?? false;
            const bonusClass = matchResult
              ? isBonusMatched
                ? 'scale-110 !border-2 !border-white opacity-100 ring-2 ring-primary-cyan/40'
                : 'scale-100 opacity-35'
              : 'scale-100 opacity-100';
            return (
              <BallHoverTooltip ball={bonusNumber}>
                <div
                  className={`lotto-ball ${bonusClass}`}
                  style={getBallStyle(bonusNumber)}
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
