import { useRef, useState } from 'react';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1780;
const CANVAS_PADDING = 56;
const GRID_GAP = 28;
const CARD_WIDTH = (CANVAS_WIDTH - CANVAS_PADDING * 2 - GRID_GAP * 2) / 3;
const POSTER_HEIGHT = 420;

async function loadPoster(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, { mode: 'cors', signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    return await createImageBitmap(await response.blob());
  } catch {
    return null;
  }
}

function drawCover(context, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  const cropX = (image.width - cropWidth) / 2;
  const cropY = (image.height - cropHeight) / 2;
  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height);
}

function drawTitle(context, title, x, y, maxWidth) {
  const words = title.split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  lines.slice(0, 2).forEach((text, index) => {
    const trimmed = index === 1 && lines.length > 2 ? `${text.replace(/[\s.,:;!?-]+$/, '')}...` : text;
    context.fillText(trimmed, x, y + index * 34, maxWidth);
  });
}

function formatYear(date) {
  return date ? date.slice(0, 4) : 'Year unknown';
}

export default function TopNine({ shows, onRemove, onMove }) {
  const boardRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  async function exportBoard() {
    if (!boardRef.current || exporting || shows.length === 0) return;

    setExporting(true);
    setExportMessage('');

    try {
      const posters = await Promise.all(shows.map((show) => loadPoster(show.posterUrl)));
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable.');

      const styles = window.getComputedStyle(boardRef.current);
      const color = (name) => styles.getPropertyValue(name).trim();
      const fontFamily = color('--font-body');
      const pageColor = color('--page');
      const surfaceColor = color('--surface');
      const textColor = color('--text');
      const mutedColor = color('--muted');
      const borderColor = color('--border');
      const accentColor = color('--accent');

      context.fillStyle = pageColor;
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.fillStyle = textColor;
      context.font = `600 20px ${fontFamily}`;
      context.fillText('Your top 9', CANVAS_PADDING, 74);
      context.fillStyle = mutedColor;
      context.font = `400 14px ${fontFamily}`;
      context.fillText(`${shows.length} of 9 shows`, CANVAS_PADDING, 110);
      context.strokeStyle = borderColor;
      context.beginPath();
      context.moveTo(CANVAS_PADDING, 136);
      context.lineTo(CANVAS_WIDTH - CANVAS_PADDING, 136);
      context.stroke();

      for (let index = 0; index < 9; index += 1) {
        const column = index % 3;
        const row = Math.floor(index / 3);
        const x = CANVAS_PADDING + column * (CARD_WIDTH + GRID_GAP);
        const y = 166 + row * (POSTER_HEIGHT + 92 + GRID_GAP);
        const show = shows[index];

        context.fillStyle = surfaceColor;
        context.fillRect(x, y, CARD_WIDTH, POSTER_HEIGHT + 92);
        context.fillStyle = pageColor;
        context.fillRect(x, y, CARD_WIDTH, POSTER_HEIGHT);

        if (posters[index]) {
          drawCover(context, posters[index], x, y, CARD_WIDTH, POSTER_HEIGHT);
        } else if (!show) {
          context.save();
          context.strokeStyle = borderColor;
          context.setLineDash([9, 8]);
          context.strokeRect(x + 1, y + 1, CARD_WIDTH - 2, POSTER_HEIGHT - 2);
          context.restore();
        } else {
          context.fillStyle = mutedColor;
          context.font = `400 14px ${fontFamily}`;
          context.textAlign = 'center';
          context.fillText('No poster', x + CARD_WIDTH / 2, y + POSTER_HEIGHT / 2);
          context.textAlign = 'left';
        }

        context.fillStyle = surfaceColor;
        context.fillRect(x + 12, y + 12, 46, 30);
        context.fillStyle = accentColor;
        context.font = `500 14px ${fontFamily}`;
        context.fillText(String(index + 1).padStart(2, '0'), x + 20, y + 33);

        if (show) {
          context.fillStyle = textColor;
          context.font = `600 20px ${fontFamily}`;
          drawTitle(context, show.title, x + 14, y + POSTER_HEIGHT + 34, CARD_WIDTH - 28);
          context.fillStyle = mutedColor;
          context.font = `400 14px ${fontFamily}`;
          context.fillText(formatYear(show.firstAirDate), x + 14, y + POSTER_HEIGHT + 78);
        } else {
          context.fillStyle = mutedColor;
          context.font = `400 14px ${fontFamily}`;
          context.textAlign = 'center';
          context.fillText('Open slot', x + CARD_WIDTH / 2, y + POSTER_HEIGHT + 52);
          context.textAlign = 'left';
        }
      }

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('Could not create the PNG.'));
        }, 'image/png');
      });
      const image = URL.createObjectURL(blob);
      const download = document.createElement('a');
      download.download = 'my-top-nine.png';
      download.href = image;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(image), 1000);
      setExportMessage('PNG downloaded.');
    } catch {
      setExportMessage('Could not export the image. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="top-nine-section" aria-labelledby="top-nine-title" ref={boardRef}>
      <div className="top-nine-heading">
        <h2 id="top-nine-title">Your top 9</h2>
        <span>{shows.length} of 9</span>
        <button
          className="export-button no-export"
          type="button"
          onClick={exportBoard}
          disabled={shows.length === 0 || exporting}
          aria-label="Export your Top 9 as a PNG image"
        >
          {exporting ? 'Creating image...' : 'Export as PNG'}
        </button>
      </div>
      {exportMessage && <p className="export-status no-export" role="status">{exportMessage}</p>}
      <ol className="top-nine-grid">
        {Array.from({ length: 9 }, (_, index) => {
          const show = shows[index];

          return (
            <li className={`top-nine-slot${show ? '' : ' empty-slot'}`} key={show ? show.id : `empty-${index}`}>
              <div className={`top-nine-art${show ? '' : ' empty'}`}>
                {show?.posterUrl ? (
                  <img src={show.posterUrl} alt="" loading="lazy" />
                ) : show ? (
                  <span className="top-nine-no-poster" aria-hidden="true">No poster</span>
                ) : (
                  <span className="empty-slot-label">Open slot</span>
                )}
                <span className="top-nine-rank">{String(index + 1).padStart(2, '0')}</span>
              </div>
              {show ? (
                <>
                  <div className="top-nine-copy">
                    <span className="top-nine-show-title">{show.title}</span>
                    <span className="top-nine-year">{formatYear(show.firstAirDate)}</span>
                  </div>
                  <div className="top-nine-actions no-export">
                    <button
                      className="slot-action"
                      type="button"
                      onClick={() => onMove(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move ${show.title} up`}
                      title="Move up"
                    >Move up</button>
                    <button
                      className="slot-action"
                      type="button"
                      onClick={() => onMove(index, 1)}
                      disabled={index === shows.length - 1}
                      aria-label={`Move ${show.title} down`}
                      title="Move down"
                    >Move down</button>
                    <button
                      className="slot-action remove-show"
                      type="button"
                      onClick={() => onRemove(show.id)}
                      aria-label={`Remove ${show.title}`}
                      title="Remove from Top 9"
                    >Remove</button>
                  </div>
                </>
              ) : (
                <div className="top-nine-actions no-export" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}