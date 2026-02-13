export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-16 sm:pt-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
          Open Source
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
          Secure autonomous AI agents{" "}
          <span className="text-green-400">in 60 seconds.</span>
        </h1>

        <p className="mt-6 text-lg leading-8 text-neutral-400 sm:text-xl">
          The OpenClaw alternative that doesn't compromise your security.
          <br />
          Docker isolation. Hard guardrails. Zero inbound ports.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#get-started"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-100"
          >
            Get Started — Free
          </a>
          <a
            href="/templates"
            className="rounded-lg border border-neutral-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-neutral-500 hover:bg-neutral-800"
          >
            View Templates
          </a>
        </div>

        {/* Interactive terminal */}
        <div className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-xs text-neutral-500">Terminal</span>
          </div>
          <div id="terminal" className="p-6 text-left font-mono text-sm leading-relaxed min-h-[280px]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        #terminal .cursor {
          display: inline-block;
          width: 8px;
          height: 16px;
          background: #4ade80;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 0.8s step-end infinite;
        }
        #terminal .line { min-height: 1.5em; white-space: pre; }
        #terminal .line.mt { margin-top: 0.75em; }
      `}} />

      <script dangerouslySetInnerHTML={{__html: `
        (function() {
          var el = document.getElementById('terminal');
          if (!el) return;

          var lines = [
            { text: '$ ', color: '#737373', typing: false, inline: [
              { text: 'npx seclaw', color: '#4ade80', typing: true, speed: 60 }
            ]},
            { text: '', pause: 600 },
            { text: '', pause: 300, mt: true },
            { text: '  LLM Provider ', color: '#737373', typing: false, inline: [
              { text: 'google/gemini-3-flash-preview', color: '#fff', typing: true, speed: 40 }
            ]},
            { text: '  Telegram Token ', color: '#737373', typing: false, inline: [
              { text: '723***:AAF***', color: '#fff', typing: true, speed: 40 }
            ]},
            { text: '  Template ', color: '#737373', typing: false, inline: [
              { text: 'Productivity Agent', color: '#4ade80', typing: true, speed: 40 },
              { text: ' (free)', color: '#737373', typing: false }
            ]},
            { text: '', pause: 500, mt: true },
            { text: '  Project created', color: '#4ade80', typing: false, prefix: '\u2713 ', prefixColor: '#4ade80', appear: true, delay: 300 },
            { text: '  Docker Compose started', color: '#4ade80', typing: false, prefix: '\u2713 ', prefixColor: '#4ade80', appear: true, delay: 300 },
            { text: '  Cloudflare Tunnel connected', color: '#4ade80', typing: false, prefix: '\u2713 ', prefixColor: '#4ade80', appear: true, delay: 300 },
            { text: '  Inngest scheduler ready', color: '#4ade80', typing: false, prefix: '\u2713 ', prefixColor: '#4ade80', appear: true, delay: 300 },
            { text: '', pause: 400, mt: true },
            { text: '  Agent running on ', color: '#a3a3a3', typing: false, inline: [
              { text: 'http://localhost:3000', color: '#60a5fa', typing: false }
            ]},
            { text: '  Inngest dashboard ', color: '#a3a3a3', typing: false, inline: [
              { text: 'http://localhost:8288', color: '#60a5fa', typing: false }
            ]},
            { text: '', pause: 300, mt: true },
            { text: '  Message your Telegram bot to get started!', color: '#737373', typing: false },
          ];

          var currentLine = 0;
          var container = el;

          function createSpan(text, color) {
            var s = document.createElement('span');
            s.style.color = color || '#fff';
            s.textContent = text;
            return s;
          }

          function addCursor(parent) {
            var c = document.createElement('span');
            c.className = 'cursor';
            parent.appendChild(c);
            return c;
          }

          function removeCursor() {
            var c = container.querySelector('.cursor');
            if (c) c.remove();
          }

          function typeText(parent, text, color, speed, cb) {
            var i = 0;
            var span = createSpan('', color);
            parent.appendChild(span);
            var cursor = addCursor(parent);
            function tick() {
              if (i < text.length) {
                span.textContent += text[i];
                i++;
                setTimeout(tick, speed + Math.random() * 30);
              } else {
                cursor.remove();
                if (cb) cb();
              }
            }
            tick();
          }

          function processLine(def) {
            var div = document.createElement('div');
            div.className = 'line' + (def.mt ? ' mt' : '');

            if (def.pause !== undefined && !def.text && !def.prefix) {
              container.appendChild(div);
              setTimeout(function() { nextLine(); }, def.pause);
              return;
            }

            if (def.appear) {
              div.style.opacity = '0';
              if (def.prefix) {
                var ps = createSpan(def.prefix, def.prefixColor || def.color);
                div.appendChild(ps);
              }
              var ts = createSpan(def.text, def.color);
              div.appendChild(ts);
              container.appendChild(div);
              setTimeout(function() {
                div.style.transition = 'opacity 0.3s';
                div.style.opacity = '1';
                setTimeout(function() { nextLine(); }, def.delay || 200);
              }, def.delay || 200);
              return;
            }

            container.appendChild(div);

            if (def.prefix) {
              div.appendChild(createSpan(def.prefix, def.prefixColor || def.color));
            }

            if (def.typing) {
              typeText(div, def.text, def.color, def.speed || 50, function() {
                processInline(div, def.inline, 0);
              });
            } else {
              div.appendChild(createSpan(def.text, def.color));
              processInline(div, def.inline, 0);
            }
          }

          function processInline(div, inlines, idx) {
            if (!inlines || idx >= inlines.length) {
              nextLine();
              return;
            }
            var part = inlines[idx];
            if (part.typing) {
              typeText(div, part.text, part.color, part.speed || 50, function() {
                processInline(div, inlines, idx + 1);
              });
            } else {
              div.appendChild(createSpan(part.text, part.color));
              processInline(div, inlines, idx + 1);
            }
          }

          function nextLine() {
            currentLine++;
            if (currentLine < lines.length) {
              var def = lines[currentLine];
              var delay = def.pause && !def.text ? 0 : 80;
              setTimeout(function() { processLine(def); }, delay);
            } else {
              // Add final blinking cursor
              var last = container.lastElementChild;
              if (last) addCursor(last);
              // Restart after pause
              setTimeout(function() {
                container.innerHTML = '';
                currentLine = 0;
                processLine(lines[0]);
              }, 4000);
            }
          }

          // Start animation when visible
          var observer = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
              observer.disconnect();
              processLine(lines[0]);
            }
          }, { threshold: 0.3 });
          observer.observe(el);
        })();
      `}} />
    </section>
  );
}
