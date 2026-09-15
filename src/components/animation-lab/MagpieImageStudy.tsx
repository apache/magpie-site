// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from "react";
import { withBase } from "@/ui/lib/utils";

/** Animate the approved artwork itself so its face and materials stay intact. */
export function MagpieImageStudy({ paused, initialTime = 0, speed = 1 }: {
  paused: boolean; initialTime?: number; speed?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const settings = useRef({ paused, speed });
  settings.current = { paused, speed };
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("three").then(async (T) => {
      const texture = await new T.TextureLoader().loadAsync(withBase("/illustrations/magpie/3d/magpie-front.png"));
      if (disposed || !host.current) { texture.dispose(); return; }
      const element = host.current;
      const stage = element.closest<HTMLElement>(".lab-stage")!;
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try { renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); }
      catch { texture.dispose(); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.outputColorSpace = T.SRGBColorSpace;
      texture.colorSpace = T.SRGBColorSpace;
      const scene = new T.Scene();
      const camera = new T.OrthographicCamera(-1.3, 1.3, 1.3, -1.3, 0.1, 10);
      camera.position.z = 3;
      const uniforms = {
        artwork: { value: texture },
        wing: { value: 0 },
        gaze: { value: new T.Vector2() },
        breath: { value: 0 },
      };
      const material = new T.ShaderMaterial({
        transparent: true,
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          uniform float wing;
          uniform vec2 gaze;
          uniform float breath;
          void main() {
            vUv = uv;
            vec3 p = position;
            // Continuous image mesh: no duplicate wing or replacement silhouette.
            vec2 nearWing = (uv - vec2(.50, .47)) / vec2(.13, .18);
            float nearWeight = exp(-dot(nearWing, nearWing) * 1.7);
            vec2 farWing = (uv - vec2(.825, .49)) / vec2(.06, .15);
            float farWeight = exp(-dot(farWing, farWing) * 2.0);
            p.x += wing * (-nearWeight * .24 + farWeight * .09);
            p.y += wing * (nearWeight * .14 + farWeight * .06);
            float head = smoothstep(.58, .76, uv.y);
            p.x += gaze.x * .065 * head;
            p.y += gaze.y * .045 * head;
            p.y += breath * smoothstep(.15, .55, uv.y);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform sampler2D artwork;
          void main() {
            gl_FragColor = texture2D(artwork, vUv);
            #include <colorspace_fragment>
          }
        `,
      });
      const geometry = new T.PlaneGeometry(2, 2, 100, 100);
      const bird = new T.Mesh(geometry, material);
      scene.add(bird);
      renderer.domElement.setAttribute("aria-hidden", "true");
      element.appendChild(renderer.domElement);
      element.dataset.ready = "true";
      const motion = matchMedia("(prefers-reduced-motion: reduce)");
      let time = initialTime, last = 0, frame = 0, visible = true;
      let targetX = 0, targetY = 0, lookX = 0, lookY = 0;
      const smooth = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
      const draw = () => {
        const t = motion.matches ? 4.4 : time;
        const approach = smooth(t / 3.1);
        const landing = smooth((t - 3.1) / 1.3);
        const landed = t >= 4.4;
        element.dataset.phase = landed ? "landed" : t < 3.1 ? "flying" : "landing";
        const moving = !settings.current.paused && !motion.matches;
        if (moving && landed) { lookX += (targetX - lookX) * .08; lookY += (targetY - lookY) * .08; }
        const x = -stage.clientWidth * .82 * (1 - approach);
        const y = -25 * (1 - landing) - Math.sin(approach * Math.PI) * 60;
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        bird.rotation.z = -.16 * (1 - landing) + Math.sin(t * 9) * .025 * (1 - landing);
        const squash = Math.sin(landing * Math.PI) * .045;
        bird.scale.set(1 + squash, 1 - squash, 1);
        uniforms.wing.value = (1 - landing) * (.35 + Math.sin(t * 10) * .65);
        uniforms.gaze.value.set(lookX, -lookY);
        uniforms.breath.value = landed ? Math.sin(t * 1.8) * .003 : 0;
        renderer.render(scene, camera);
      };
      const resize = new ResizeObserver(() => {
        const w = element.clientWidth, h = element.clientHeight;
        if (!w || !h) return;
        const aspect = w / h;
        camera.left = -1.16 * aspect; camera.right = 1.16 * aspect;
        camera.top = 1.16; camera.bottom = -1.16;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h); draw();
      });
      resize.observe(element);
      const follow = (event: PointerEvent) => {
        if (time < 4.4 || motion.matches || settings.current.paused) return;
        const rect = element.getBoundingClientRect();
        targetX = T.MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
        targetY = T.MathUtils.clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
      };
      const reset = () => { targetX = 0; targetY = 0; };
      stage.addEventListener("pointermove", follow);
      stage.addEventListener("pointerleave", reset);
      const tick = (now: number) => {
        if (disposed) return;
        if (visible && !document.hidden) {
          if (last && !settings.current.paused && !motion.matches) time += Math.min((now - last) / 1000, .05) * settings.current.speed;
          draw();
        }
        last = now;
        frame = requestAnimationFrame(tick);
      };
      const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; last = 0; });
      observer.observe(stage);
      frame = requestAnimationFrame(tick);
      cleanup = () => {
        cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect();
        stage.removeEventListener("pointermove", follow); stage.removeEventListener("pointerleave", reset);
        geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose();
        renderer.domElement.remove(); delete element.dataset.ready; element.style.removeProperty("transform");
      };
    }).catch(() => { /* Keep the approved image visible if WebGL is unavailable. */ });
    return () => { disposed = true; cleanup(); };
  }, []);
  return <div className="k-magpie-model" ref={host} role="img" aria-label="Magpie azul original animado. Após pousar, acompanha o mouse.">
    <img src={withBase("/illustrations/magpie/3d/magpie-front.png")} alt="" width="1254" height="1254" />
  </div>;
}
