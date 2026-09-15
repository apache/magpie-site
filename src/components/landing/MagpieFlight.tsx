// SPDX-License-Identifier: Apache-2.0
import { useEffect, useRef } from "react";
import { withBase } from "@/ui/lib/utils";

/** Shared articulated mascot for the homepage and animation preview. */
export function MagpieFlight({ paused, initialTime = 0, speed = 1, view = "reference" }: { paused: boolean; initialTime?: number; speed?: number; view?: string }) {
  const viewRef = useRef(view);
  viewRef.current = view;
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<(value: boolean) => void>(() => {});
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
    control.current(paused);
  }, [paused, view]);
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    import("three")
      .then((T) => {
        if (cancelled || !host.current) return;
        const element = host.current;
        let renderer: InstanceType<typeof T.WebGLRenderer>;
        try {
          renderer = new T.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "low-power",
          });
        } catch {
          return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = false;
        renderer.shadowMap.type = T.VSMShadowMap;
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.toneMapping = T.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        element.appendChild(renderer.domElement);
        renderer.domElement.setAttribute("aria-hidden", "true");
        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(30, 1, 0.1, 40);
        camera.position.set(5.8, 1.65, 6.5);
        camera.lookAt(-0.2, 0.12, 0);
        // Broad studio highlights, with soft fill instead of hard cast shadows.
        scene.add(new T.HemisphereLight(0xffffff, 0x7886a8, 2.0));
        const keyLight = new T.DirectionalLight(0xffffff, 3.2);
        keyLight.position.set(-3, 6, 5);
        scene.add(keyLight);
        const fillLight = new T.DirectionalLight(0xe7efff, .8);
        fillLight.position.set(5, 2, 1);
        scene.add(fillLight);
        const rimLight = new T.DirectionalLight(0xd8e6ff, 1.1);
        rimLight.position.set(1, 4, -4);
        scene.add(rimLight);
        const plumage = new T.MeshPhysicalMaterial({ color: 0x0752da, roughness: .30, metalness: 0, clearcoat: .22, clearcoatRoughness: .35 });
        const flightFeathers = new T.MeshPhysicalMaterial({ color: 0x064dca, roughness: .32, metalness: 0, clearcoat: .18 });
        const eyes = new T.MeshPhysicalMaterial({ color: 0x034bc9, roughness: .3, clearcoat: .2 });
        const white = new T.MeshPhysicalMaterial({ color: 0xfffdf7, roughness: .55, metalness: 0 });
        const dark = new T.MeshStandardMaterial({ color: 0x11151a, roughness: .55 });
        const sphere = new T.SphereGeometry(1, 32, 24);
        const bird = new T.Group();
        scene.add(bird);
        const ellipsoid = (
          parent: InstanceType<typeof T.Group>,
          material: InstanceType<typeof T.Material>,
          x: number,
          y: number,
          z: number,
          sx: number,
          sy: number,
          sz: number,
        ) => {
          const mesh = new T.Mesh(sphere, material);
          mesh.position.set(x, y, z);
          mesh.scale.set(sx, sy, sz);
          mesh.castShadow = true; mesh.receiveShadow = true;
          parent.add(mesh);
          return mesh;
        };
        // One sculpted surface from belly to crown, without intersecting neck parts.
        const silhouette = new T.CatmullRomCurve3([
          new T.Vector3(0, -.77, -.06),
          new T.Vector3(.43, -.68, -.08),
          new T.Vector3(.67, -.43, -.10),
          new T.Vector3(.72, -.08, -.10),
          new T.Vector3(.65, .16, -.07),
          new T.Vector3(.50, .49, -.03),
          new T.Vector3(.46, .72, .04),
          new T.Vector3(.58, 1.00, .07),
          new T.Vector3(.64, 1.28, .05),
          new T.Vector3(.49, 1.58, .02),
          new T.Vector3(.24, 1.76, -.02),
          new T.Vector3(0, 1.81, -.03),
        ]);
        const vertices: number[] = [], indices: number[] = [];
        const rows = 140, columns = 80;
        for (let row = 0; row <= rows; row++) {
          const profile = silhouette.getPoint(row / rows);
          for (let col = 0; col <= columns; col++) {
            const angle = col / columns * Math.PI * 2;
            const x = profile.z + profile.x * Math.cos(angle);
            const z = profile.x * .86 * Math.sin(angle);
            // A shallow throat crease joins the lower bill to the white bib.
            const crease = .035 * Math.exp(-((profile.y - 1.015) ** 2) / .006 - (z * z) / .04) * Math.max(0, Math.cos(angle));
            vertices.push(x - crease, profile.y, z);
            if (row < rows && col < columns) {
              const i = row * (columns + 1) + col;
              indices.push(i, i + columns + 1, i + 1, i + 1, i + columns + 1, i + columns + 2);
            }
          }
        }
        const torsoGeometry = new T.BufferGeometry();
        torsoGeometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
        torsoGeometry.setIndex(indices);
        torsoGeometry.computeVertexNormals();
        const headAngles = { value: new T.Vector2() };
        const neckOffset = { value: new T.Vector2() };
        const torsoMaterial = plumage.clone();
        torsoMaterial.onBeforeCompile = (shader) => {
          shader.uniforms.headAngles = headAngles;
          shader.uniforms.neckOffset = neckOffset;
          shader.vertexShader = `uniform vec2 headAngles; uniform vec2 neckOffset; varying vec3 restPosition;
            vec3 turnHead(vec3 p, float weight) {
              float cy=cos(headAngles.x*weight), sy=sin(headAngles.x*weight);
              float cz=cos(headAngles.y*weight), sz=sin(headAngles.y*weight);
              vec3 q=vec3(cz*p.x-sz*p.y, sz*p.x+cz*p.y, p.z);
              return vec3(cy*q.x+sy*q.z,q.y,-sy*q.x+cy*q.z);
            }
            vec3 poseHead(vec3 p) {
              vec3 pivot=vec3(.10,1.17,0.);
              float weight=smoothstep(.32,.92,p.y);
              return turnHead(p-pivot,weight)+pivot+vec3(neckOffset,0.)*weight;
            }
` + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
            #include <begin_vertex>
            restPosition=position;
            transformed=poseHead(position);
          `).replace("#include <beginnormal_vertex>", `
            #include <beginnormal_vertex>
            // Derive normals from the bent surface, including the neck transition.
            vec3 axis=abs(objectNormal.y)<.9?vec3(0.,1.,0.):vec3(1.,0.,0.);
            vec3 tangent=normalize(cross(axis,objectNormal));
            vec3 bitangent=cross(objectNormal,tangent);
            vec3 posed=poseHead(position);
            objectNormal=normalize(cross(poseHead(position+tangent*.001)-posed,poseHead(position+bitangent*.001)-posed));
          `);
          shader.fragmentShader = "varying vec3 restPosition;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
            #include <color_fragment>
            float bibSide=smoothstep(-.15,-.13,restPosition.x);
            float bibCrest=.13*exp(-restPosition.z*restPosition.z/.045);
            float bibEdge=.43+restPosition.x*.86+bibCrest;
            float bibTop=1.-smoothstep(bibEdge,bibEdge+.02,restPosition.y);
            float bibBottom=smoothstep(-.79,-.70,restPosition.y);
            diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.98,.965,.94),bibSide*bibTop*bibBottom);
          `);
        };
        const torso = new T.Mesh(torsoGeometry, torsoMaterial);
        torso.castShadow = true; torso.receiveShadow = true;
        bird.add(torso);
        const head = new T.Group();
        head.position.set(0.10, 1.17, 0);
        bird.add(head);
        // Conform the eye markings to the crown instead of intersecting flat discs.
        const eyelid = { value: 0 };
        const eyeWhite = white.clone();
        const eyeBlue = eyes.clone();
        for (const material of [eyeWhite, eyeBlue]) {
          material.side = T.DoubleSide;
          material.onBeforeCompile = (shader) => {
            shader.uniforms.eyelid = eyelid;
            shader.uniforms.lidColor = { value: plumage.color };
            shader.vertexShader = "varying float eyeHeight;\n" + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\neyeHeight=position.y-.06;");
            shader.fragmentShader = "uniform float eyelid; uniform vec3 lidColor; varying float eyeHeight;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
              #include <color_fragment>
              float upper=mix(.235,-.24,eyelid);
              float lower=mix(-.235,-.17,eyelid);
              float covered=max(smoothstep(upper-.006,upper+.006,eyeHeight),1.-smoothstep(lower-.006,lower+.006,eyeHeight));
              diffuseColor.rgb=mix(diffuseColor.rgb,lidColor,covered);
            `);
          };
        }
        const eyeGeometries: InstanceType<typeof T.BufferGeometry>[] = [];
        const profileSamples = silhouette.getPoints(1000);
        const profileAtHeight = (height: number) => {
          let lo = 0, hi = profileSamples.length - 1;
          while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (profileSamples[mid].y < height) lo = mid; else hi = mid;
          }
          const a = profileSamples[lo], b = profileSamples[hi];
          return a.clone().lerp(b, (height - a.y) / (b.y - a.y));
        };
        for (const side of [-1, 1]) {
          const positions: number[] = [], eyeIndices: number[] = [];
          const radial = 16, segments = 64;
          for (let r = 0; r <= radial; r++) {
            const fraction = r / radial;
            for (let seg = 0; seg <= segments; seg++) {
              const angle = seg / segments * Math.PI * 2;
              const y = 1.23 + Math.sin(angle) * .23 * fraction;
              const theta = side * (.98 + Math.cos(angle) * .37 * fraction);
              const profile = profileAtHeight(y);
              positions.push(profile.z + (profile.x + .012) * Math.cos(theta) - .10, y - 1.17, (profile.x * .86 + .012) * Math.sin(theta));
              if (r < radial && seg < segments) {
                const i = r * (segments + 1) + seg;
                eyeIndices.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1);
              }
            }
          }
          const geo = new T.BufferGeometry();
          geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
          geo.setIndex(eyeIndices); geo.computeVertexNormals();
          // Mirroring the surface reverses winding; keep both eyes lit outward.
          const normals = geo.getAttribute("normal");
          for (let i = 0; i < normals.count; i++) {
            const x = positions[i * 3] + .10;
            const z = positions[i * 3 + 2];
            if (normals.getX(i) * x + normals.getZ(i) * z < 0)
              normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
          }
          const pupilCount = 10 * segments * 6;
          geo.addGroup(0, pupilCount, 0);
          geo.addGroup(pupilCount, eyeIndices.length - pupilCount, 1);
          eyes.side = T.DoubleSide; white.side = T.DoubleSide;
          head.add(new T.Mesh(geo, [eyeBlue, eyeWhite]));
          eyeGeometries.push(geo);
        }
        // Two rounded shells meet along a lip; the lower shell hinges at the skull.
        const billProfile = [new T.Vector2(0, 0), new T.Vector2(.16, .015), new T.Vector2(.18, .09), new T.Vector2(.145, .23), new T.Vector2(.08, .36), new T.Vector2(.025, .42), new T.Vector2(0, .44)];
        const billGeometry = new T.LatheGeometry(billProfile, 48);
        const lowerBillGeometry = billGeometry.clone();
        const shapeBill = (geometry: InstanceType<typeof T.LatheGeometry>, lower: boolean) => {
          const positions = geometry.getAttribute("position");
          for (let i = 0; i < positions.count; i++) {
            const radial = positions.getX(i), length = positions.getY(i), width = positions.getZ(i);
            // A flattened contact surface prevents the two halves looking like tubes.
            const height = Math.max(0, radial) * (lower ? -.48 : .72);
            positions.setXYZ(i, length, height, width * .90);
          }
          if (!lower) {
            const index = geometry.getIndex()!;
            for (let i = 0; i < index.count; i += 3) {
              const first = index.getX(i);
              index.setX(i, index.getX(i + 2));
              index.setX(i + 2, first);
            }
          }
          geometry.computeVertexNormals();
        };
        shapeBill(billGeometry, false);
        shapeBill(lowerBillGeometry, true);
        const beak = new T.Mesh(billGeometry, plumage);
        beak.position.set(.47, -.015, 0);
        beak.scale.set(1.25, 1.15, 1.08);
        head.add(beak);
        const jawHinge = new T.Group();
        jawHinge.position.set(.47, -.029, 0);
        head.add(jawHinge);
        const jaw = new T.Mesh(lowerBillGeometry, plumage);
        jaw.scale.set(1.25, 1.15, 1.08);
        jawHinge.add(jaw);
        const mouth = ellipsoid(head, dark, .61, -.023, 0, .16, .012, .105);
        const tail = new T.Group();
        tail.position.set(-0.55, -0.57, 0);
        bird.add(tail);
        const tailProfile = new T.CatmullRomCurve3([
          new T.Vector3(0,0,0), new T.Vector3(.15,.05,0),
          new T.Vector3(.22,.35,0), new T.Vector3(.20,1.20,0),
          new T.Vector3(.18,2.1,0), new T.Vector3(.13,2.35,0),
          new T.Vector3(0,2.43,0),
        ]);
        const tailGeometry = new T.LatheGeometry(tailProfile.getPoints(60).map(p => new T.Vector2(p.x,p.y)), 40);
        const tailMesh = new T.Mesh(tailGeometry, flightFeathers);
        tailMesh.rotation.z = Math.PI / 2 + .58;
        tailMesh.scale.set(.62, 1, 1.08);
        tailMesh.castShadow = true;
        tail.add(tailMesh);
        const wings: {
          root: InstanceType<typeof T.Group>;
          wrist: InstanceType<typeof T.Group>;
          surface: { geometry: InstanceType<typeof T.BufferGeometry>; rest: number[] };
          side: number;
        }[] = [];
        const wingGeometries: InstanceType<typeof T.BufferGeometry>[] = [];
        const wingMaterials: InstanceType<typeof T.MeshPhysicalMaterial>[] = [];
        for (const side of [-1, 1]) {
          const wing = new T.Group();
          wing.scale.z = side;
          bird.add(wing);
          const wrist = new T.Group();
          wing.add(wrist);
          // One continuous surface from shoulder to tip, with a flexible outer span.
          const profile = new T.CatmullRomCurve3([
            new T.Vector3(0,-.16,0), new T.Vector3(.24,.04,-.01),
            new T.Vector3(.34,.38,-.04), new T.Vector3(.39,.78,-.10),
            new T.Vector3(.36,1.18,-.20), new T.Vector3(.28,1.57,-.29),
            new T.Vector3(.13,1.91,-.37), new T.Vector3(0,2.08,-.40),
          ]);
          const positions: number[] = [], indices: number[] = [];
          const rows = 80, columns = 40;
          for (let row = 0; row <= rows; row++) {
            const p = profile.getPoint(row / rows);
            for (let col = 0; col <= columns; col++) {
              const angle = col / columns * Math.PI * 2;
              positions.push(p.z + p.x * Math.cos(angle), .10 * Math.sqrt(Math.max(0,p.x) / .39) * Math.sin(angle), p.y);
              if (row < rows && col < columns) {
                const i = row * (columns + 1) + col;
                indices.push(i,i+1,i+columns+1,i+1,i+columns+2,i+columns+1);
              }
            }
          }
          const geometry = new T.BufferGeometry();
          geometry.setAttribute("position", new T.Float32BufferAttribute(positions,3));
          geometry.setIndex(indices); geometry.computeVertexNormals();
          const surface = { geometry, rest: positions };
          const material = plumage.clone();
          material.side = T.DoubleSide;
          material.onBeforeCompile = shader => {
            shader.vertexShader = "varying vec3 wingRest;\n" + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nwingRest=position;");
            shader.fragmentShader = "varying vec3 wingRest;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
              #include <color_fragment>
              float center=-.10*wingRest.z;
              vec2 patchCoord=vec2((wingRest.x-center)/.21,(wingRest.z-.65)/.52);
              float ellipseMask=dot(patchCoord,patchCoord);
              float marking=(1.-smoothstep(.90,1.,ellipseMask))*smoothstep(.015,.045,wingRest.y);
              diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.98,.965,.94),marking);
            `);
          };
          const mesh = new T.Mesh(geometry, material);
          wing.add(mesh);
          wingGeometries.push(geometry); wingMaterials.push(material);
          wings.push({ root: wing, wrist, surface, side });
        }
        const limbGeometries: InstanceType<typeof T.BufferGeometry>[] = [];
        // Variable-radius swept surfaces give the limbs a continuous silhouette.
        const taperedLimb = (parent: InstanceType<typeof T.Group>, points: InstanceType<typeof T.Vector3>[], radii: number[]) => {
          const curve = new T.CatmullRomCurve3(points);
          const frames = curve.computeFrenetFrames(48, false);
          const positions: number[] = [], indices: number[] = [];
          for (let row = 0; row <= 48; row++) {
            const t = row / 48;
            const point = curve.getPointAt(t);
            const interval = t * (radii.length - 1);
            const i = Math.min(Math.floor(interval), radii.length - 2);
            const blend = interval - i;
            const eased = blend * blend * (3 - 2 * blend);
            const radius = radii[i + 1] === 0
              ? radii[i] * Math.sqrt(Math.max(0, 1 - blend * blend))
              : T.MathUtils.lerp(radii[i], radii[i + 1], eased);
            for (let col = 0; col <= 20; col++) {
              const angle = col / 20 * Math.PI * 2;
              const vertex = point.clone().addScaledVector(frames.normals[row], Math.cos(angle) * radius).addScaledVector(frames.binormals[row], Math.sin(angle) * radius);
              positions.push(vertex.x, vertex.y, vertex.z);
              if (row < 48 && col < 20) {
                const index = row * 21 + col;
                indices.push(index, index + 1, index + 21, index + 1, index + 22, index + 21);
              }
            }
          }
          const geometry = new T.BufferGeometry();
          geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
          geometry.setIndex(indices); geometry.computeVertexNormals();
          limbGeometries.push(geometry);
          const mesh = new T.Mesh(geometry, plumage);
          mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
          return mesh;
        };
        const feet: { root: InstanceType<typeof T.Group>; toes: InstanceType<typeof T.Group>; leg: InstanceType<typeof T.Mesh>; rest: Float32Array }[] = [];
        for (const side of [-1, 1]) {
          const foot = new T.Group();
          foot.position.set(-0.04, -0.59, side * 0.34);
          bird.add(foot);
          const leg = taperedLimb(foot, [
            new T.Vector3(-.055,.16,0), new T.Vector3(-.05,-.08,0),
            new T.Vector3(-.025,-.29,0), new T.Vector3(.015,-.55,0),
            new T.Vector3(.09,-.74,0),
          ], [.17,.16,.095,.059,.056,.068,.082]);
          const toes = new T.Group();
          toes.position.y = -.74;
          foot.add(toes);
          feet.push({ root: foot, toes, leg, rest: new Float32Array(leg.geometry.getAttribute("position").array) });
          const tips = [
            new T.Vector3(-.02,-.755,-.43),
            new T.Vector3(.43,-.775,.04),
            new T.Vector3(.16,-.755,.45),
          ];
          for (const tip of tips) {
            const toe = taperedLimb(toes, [
              new T.Vector3(.065,-.69,0),
              new T.Vector3(.09,-.735,0).lerp(tip,.38),
              new T.Vector3(.09,-.755,0).lerp(tip,.80),
              tip,
            ], [.069,.061,.055,.05,.046,.043,.038,.03,0]);
            toe.position.y = .74;
          }
        }
        const sweatMaterial = new T.MeshPhysicalMaterial({ color: 0x83cfff, roughness: .18, transparent: true, opacity: .8 });
        const sweatDrops = Array.from({ length: 3 }, () => {
          const drop = new T.Mesh(sphere, sweatMaterial);
          drop.visible = false;
          bird.add(drop);
          return drop;
        });
        const groundMaterial = new T.MeshBasicMaterial({
          color: 0x234577,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
        });
        const ground = new T.Mesh(sphere, groundMaterial);
        ground.position.set(-0.05, -1.59, 0);
        ground.scale.set(0.86, 0.018, 0.56);
        scene.add(ground);
        const shadowGeometry = new T.PlaneGeometry(10,10);
        const shadowMaterial = new T.ShadowMaterial({opacity:.07});
        const shadowFloor = new T.Mesh(shadowGeometry, shadowMaterial);
        shadowFloor.rotation.x = -Math.PI/2; shadowFloor.position.y = -1.64;
        shadowFloor.receiveShadow = true; scene.add(shadowFloor);
        let time = initialTime,
          last = 0,
          frame = 0,
          visible = true,
          stopped = pausedRef.current;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let targetX = 0,
          targetY = 0,
          lookX = 0,
          lookY = 0;
        let reactionTime = 2, reactionKind = -1;
        let lastPointerTime = -100;
        const reacting = () => reactionTime < 1.8;
        const hero = element.closest<HTMLElement>(".k-hero") ?? element;
        let travelWidth = hero.clientWidth;
        const smooth = (value: number) => {
          const t = Math.max(0, Math.min(1, value));
          return t * t * (3 - 2 * t);
        };
        const landingTime = 4.4;
        const pose = () => {
          const view = viewRef.current;
          if (view === "side") camera.position.set(.25, .8, 8.7);
          else if (view === "front") camera.position.set(8.7, .8, .25);
          else camera.position.set(5.8, 1.65, 6.5);
          camera.lookAt(-.2, .12, 0);
          // Fly across the hero, brake with open wings, then settle once.
          const elapsed = motion.matches ? landingTime : time;
          const approach = smooth(elapsed / 3.1);
          const landing = smooth((elapsed - 3.1) / 1.3);
          const fold = smooth((elapsed - 3.65) / 0.75);
          const landed = elapsed >= landingTime;
          const phase = landed ? "landed" : elapsed < 3.1 ? "flying" : "landing";
          if (element.dataset.phase !== phase) element.dataset.phase = phase;
          if (!stopped && landed && !motion.matches) {
            const idleTime = elapsed - landingTime;
            const scan = idleTime % 9;
            const glance = scan > 2 && scan < 4.7 ? -.65 * Math.sin((scan - 2) / 2.7 * Math.PI) ** 2
              : scan > 6 && scan < 8.3 ? .55 * Math.sin((scan - 6) / 2.3 * Math.PI) ** 2 : 0;
            const following = elapsed - lastPointerTime < 2.5;
            const gazeX = following ? targetX : glance;
            const gazeY = following ? targetY : Math.sin(idleTime * .65) * .10;
            lookX += (gazeX - lookX) * .06;
            lookY += (gazeY - lookY) * .06;
          }
          const flightX = -travelWidth * 0.82 * (1 - approach);
          const flightY = -25 * (1 - landing) - Math.sin(approach * Math.PI) * 45;
          element.style.transform = `translate3d(${flightX}px, ${flightY}px, 0)`;
          const flap = Math.sin(elapsed * 10.5);
          const airborne = 1 - landing;
          const breathing = landed ? Math.sin(elapsed * 2.1) * 0.008 : 0;
          const contact = smooth((elapsed - 3.88) / .22);
          const settleTime = Math.max(0, elapsed - 4.0);
          const landingBend = contact * Math.exp(-settleTime * 5) * (.17 + .07 * Math.sin(settleTime * 18));
          const rt = reactionTime;
          const envelope = reacting() ? Math.sin(Math.PI * rt / 1.8) ** 2 : 0;
          const hop = reactionKind === 0 ? Math.sin(Math.PI * smooth((rt - .3) / .7)) * .48 : 0;
          const crouch = reactionKind === 0 ? .10 * Math.exp(-(((rt - .22) / .14) ** 2)) + .08 * Math.exp(-(((rt - 1.03) / .13) ** 2)) : 0;
          const curious = reactionKind === 1 ? envelope : 0;
          const shake = reactionKind === 2 ? envelope : 0;
          // One relieved forehead wipe after landing: prepare, lift, wipe, exhale.
          const wipeTime = elapsed - 5.2;
          const wipe = motion.matches ? 0 : smooth(wipeTime / .65) * (1 - smooth((wipeTime - 1.7) / .65));
          const relief = motion.matches ? 0 : smooth((wipeTime - 1.65) / .35) * (1 - smooth((wipeTime - 2.4) / .65));
          const stroke = smooth((wipeTime - .72) / .90);
          const touchdown = landingBend + crouch + wipe * .06 + relief * .035;
          bird.position.set(0, -0.23 + airborne * 0.2 + flap * 0.055 * airborne - touchdown + breathing + hop, 0);
          bird.rotation.set(
            0.03 + Math.sin(approach * Math.PI) * 0.14,
            -0.22 + Math.sin(approach * Math.PI * 2) * 0.18,
            -0.36 * (1 - landing) - landing * .10 + curious * .10 + shake * Math.sin(rt * 22) * .045,
          );
          bird.scale.setScalar(0.78 + approach * 0.27);
          for (const w of wings) {
            // A single articulated wing per side throughout the entire flight.
            // Its upper surface rolls outward as the span sweeps toward the tail.
            const flight = new T.Quaternion().setFromEuler(new T.Euler(
              -w.side * ((0.28 + flap * 0.9) * airborne + landing * 0.45),
              0,
              0,
            ));
            const folded = new T.Quaternion().setFromRotationMatrix(
              new T.Matrix4().makeBasis(
                new T.Vector3(0.7071068, -0.7071068, 0),
                new T.Vector3(0, 0, w.side),
                new T.Vector3(-0.7071068 * w.side, -0.7071068 * w.side, 0),
              ),
            );
            w.root.quaternion.copy(flight).slerp(folded, fold * (1 - shake * (.24 + Math.sin(rt * 25) * .10) - hop * .35));
            w.root.position.set(0.10, 0.43, w.side * (0.39 + fold * (w.side > 0 ? 0.25 : 0.08)));
            w.root.scale.set(1 + fold * .10, 1, w.side * (1 + fold * 0.02));
            const wingPositions = w.surface.geometry.getAttribute("position") as InstanceType<typeof T.BufferAttribute>;
            for (let i = 0; i < wingPositions.count; i++) {
              const z = w.surface.rest[i * 3 + 2];
              const outer = smooth((z - .45) / 1.4);
              wingPositions.setXYZ(i, w.surface.rest[i * 3] + Math.max(0,z) * fold * .16, w.surface.rest[i * 3 + 1] + outer * outer * Math.sin(elapsed * 10.5 - .7) * airborne * .09, z - Math.max(0,z-.45) * fold * .42);
            }
            wingPositions.needsUpdate = true;
            w.surface.geometry.computeVertexNormals();
            w.wrist.rotation.set(
              -0.23 * Math.sin(elapsed * 10.5 - 0.7) * airborne,
              fold * 0.45,
              0,
            );
            w.wrist.position.set(-0.18 + fold * 0.16, 0, 0.83 - fold * 0.35);
            w.wrist.scale.set(1 - fold * 0.55, 1, 1 - fold * 0.82);
            if (w.side === 1 && wipe > 0) {
              // Take the long forward arc from the folded pose, never behind the skull.
              const liftAngle = T.MathUtils.lerp(-Math.PI * .75, 1.38, wipe);
              const direction = new T.Vector3(Math.cos(liftAngle), Math.sin(liftAngle), -wipe * (.02 + stroke * .28)).normalize();
              const lateral = new T.Vector3(-direction.y, direction.x, 0).normalize();
              const normal = new T.Vector3().crossVectors(direction, lateral).normalize();
              w.root.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(lateral, normal, direction));
              w.root.position.x += wipe * .15;
              w.root.position.y += wipe * .20;
              w.root.position.z += wipe * .30;
              w.root.scale.x *= 1 - wipe * .18;
              w.wrist.scale.z *= 1 - wipe * .35;
            }
          }
          sweatDrops.forEach((drop, index) => {
            const travel = (wipeTime - .8 - index * .17) / .65;
            drop.visible = wipe > 0 && travel > 0 && travel < 1;
            if (drop.visible) {
              drop.position.set(.25 + travel * .18, 1.73 + Math.sin(travel * Math.PI) * .16 - travel * .18, .55 + travel * .42);
              const size = Math.sin(travel * Math.PI) * .035;
              drop.scale.set(size, size * 1.65, size);
              drop.rotation.x = -.5;
            }
          });
          feet.forEach(({ root, toes, leg, rest }, index) => {
            // Extend each leg before contact, then absorb weight through the ankle.
            const extension = smooth((elapsed - 3.3 - index * .10) / .55);
            const tuck = (1 - extension) * .36 + hop * .24;
            const bend = touchdown / .78;
            root.rotation.z = -.20 * (1 - extension) + hop * .15;
            root.scale.y = 1 - bend - tuck * .65;
            toes.scale.y = 1 / root.scale.y;
            toes.position.x = -tuck * .65;
            toes.rotation.z = .38 * (1 - extension) - hop * .35;
            const positions = leg.geometry.getAttribute("position");
            for (let i = 0; i < positions.count; i++) {
              const height = T.MathUtils.clamp((rest[i * 3 + 1] + .74) / .90, 0, 1);
              positions.setX(i, rest[i * 3] + Math.sin(height * Math.PI) * (tuck * 1.1 + bend * .85) - tuck * .65 * (1 - height));
            }
            positions.needsUpdate = true;
            leg.geometry.computeVertexNormals();
          });
          groundMaterial.opacity = 0;
          shadowFloor.visible = false;
          ground.scale.set(0.86 + (1 - landing) * 0.3, 0.018, 0.56);
          tail.rotation.y = .45 + Math.sin(elapsed * 1.4) * 0.035;
          tail.rotation.z = landing * 0.04 + Math.sin(elapsed * 1.7) * 0.02;
          // The neck yields after each wing stroke and settles after touchdown.
          const neckWave = Math.sin(elapsed * 10.5 - .9);
          const neckRecovery = elapsed > 3.95
            ? Math.sin((elapsed - 3.95) * 13) * Math.exp(-(elapsed - 3.95) * 5) : 0;
          const reach = airborne * (.045 + neckWave * .055);
          const neckLift = airborne * Math.sin(elapsed * 10.5 - 1.5) * .055 - neckRecovery * .035;
          neckOffset.value.set(reach, neckLift);
          head.position.set(.10 + reach, 1.17 + neckLift, 0);
          head.rotation.y = lookX * .38 * (1 - wipe) - wipe * .025 + curious * Math.sin(rt * 5) * .24 + airborne * Math.sin(elapsed * 2.2) * .055;
          head.rotation.z = airborne * (.16 - neckWave * .12) + .20 - lookY * .12 * (1 - wipe) + curious * .16 + shake * Math.sin(rt * 18) * .06 + neckRecovery * .09 - wipe * .025 + relief * .06;
          const chirp = reacting() ? envelope * Math.max(0, Math.sin(rt * 14)) : landed ? Math.max(0, Math.sin(elapsed * .85)) ** 16 * .35 : 0;
          jawHinge.rotation.z = -Math.max(chirp, relief * .65) * .38;
          mouth.scale.y = .012 + chirp * .035;
          headAngles.value.set(head.rotation.y, head.rotation.z);
          const blinkClock = Math.max(0, elapsed - landingTime) % 14.7;
          let blink = 0;
          if (landed && !motion.matches) {
            for (const start of [2.4, 6.5, 6.84, 11.4]) {
              const progress = (blinkClock - start) / .26;
              if (progress > 0 && progress < 1) blink = Math.sin(progress * Math.PI) ** .65;
            }
          }
          eyelid.value = Math.max(blink, wipe * .60, relief * .82);
          renderer.render(scene, camera);
        };
        const tick = (now: number) => {
          frame = 0;
          if ((stopped && !reacting()) || motion.matches || !visible || document.hidden) return;
          if (last) {
            const dt = Math.min((now - last) / 1000, .05) * speedRef.current;
            if (!stopped) time += dt;
            if (reacting()) reactionTime = Math.min(1.8, reactionTime + dt);
          }
          last = now;
          pose();
          frame = requestAnimationFrame(tick);
        };
        const sync = () => {
          cancelAnimationFrame(frame);
          frame = 0;
          last = 0;
          pose();
          if ((!stopped || reacting()) && !motion.matches && visible && !document.hidden)
            frame = requestAnimationFrame(tick);
        };
        control.current = (value) => {
          stopped = value;
          sync();
        };
        const resize = new ResizeObserver(() => {
          travelWidth = hero.clientWidth;
          const w = element.clientWidth,
            h = element.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          pose();
        });
        resize.observe(element);
        const intersection = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          sync();
        });
        intersection.observe(hero);
        motion.addEventListener("change", sync);
        document.addEventListener("visibilitychange", sync);
        const contextLost = (event: Event) => {
          event.preventDefault();
          cancelAnimationFrame(frame);
          element.dataset.ready = "false";
        };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        const follow = (event: PointerEvent) => {
          if (stopped || motion.matches || time < landingTime) return;
          lastPointerTime = time;
          const box = element.getBoundingClientRect();
          targetX = Math.max(
            -1,
            Math.min(1, ((event.clientX - box.left) / box.width - 0.5) * 2),
          );
          targetY = Math.max(
            -1,
            Math.min(1, ((event.clientY - box.top) / box.height - 0.5) * 2),
          );

        };
        const resetLook = () => {
          targetX = 0;
          targetY = 0;
          lastPointerTime = -100;

        };
        const playReaction = () => {
          if ((!motion.matches && (time < landingTime || (time > 5.2 && time < 8.3))) || reacting()) return;
          reactionKind = (reactionKind + 1) % 3;
          if (motion.matches) {
            lookX = reactionKind === 1 ? -.35 : .35;
            pose();
            return;
          }
          reactionTime = 0;
          sync();
        };
        const raycaster = new T.Raycaster();
        const clickBird = (event: MouseEvent) => {
          const box = element.getBoundingClientRect();
          raycaster.setFromCamera(new T.Vector2((event.clientX - box.left) / box.width * 2 - 1, 1 - (event.clientY - box.top) / box.height * 2), camera);
          if (raycaster.intersectObject(bird, true).length) playReaction();
        };
        const keyboard = (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            playReaction();
            return;
          }
          if (stopped || motion.matches || time < landingTime) return;
          if (
            ![
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Escape",
            ].includes(event.key)
          )
            return;
          event.preventDefault();

          lastPointerTime = time;
          if (event.key === "ArrowLeft") targetX = Math.max(-1, targetX - 0.3);
          if (event.key === "ArrowRight") targetX = Math.min(1, targetX + 0.3);
          if (event.key === "ArrowUp") targetY = Math.max(-1, targetY - 0.3);
          if (event.key === "ArrowDown") targetY = Math.min(1, targetY + 0.3);
          if (event.key === "Escape") resetLook();
        };
        hero.addEventListener("pointermove", follow);
        element.addEventListener("pointerdown", follow);
        element.addEventListener("click", clickBird);
        hero.addEventListener("pointerleave", resetLook);
        element.addEventListener("keydown", keyboard);
        element.addEventListener("blur", resetLook);
        element.dataset.ready = "true";
        sync();
        cleanup = () => {
          cancelAnimationFrame(frame);
          hero.removeEventListener("pointermove", follow);
          element.removeEventListener("pointerdown", follow);
          element.removeEventListener("click", clickBird);
          hero.removeEventListener("pointerleave", resetLook);
          element.removeEventListener("keydown", keyboard);
          element.removeEventListener("blur", resetLook);
          resize.disconnect();
          intersection.disconnect();
          motion.removeEventListener("change", sync);
          document.removeEventListener("visibilitychange", sync);
          renderer.domElement.removeEventListener(
            "webglcontextlost",
            contextLost,
          );
          sphere.dispose();
          billGeometry.dispose();
          lowerBillGeometry.dispose();
          torsoGeometry.dispose();
          tailGeometry.dispose();
          limbGeometries.forEach(geometry => geometry.dispose());
          wingGeometries.forEach(geometry => geometry.dispose());
          wingMaterials.forEach(material => material.dispose());
          shadowGeometry.dispose(); shadowMaterial.dispose();
          torsoMaterial.dispose();
          eyeGeometries.forEach((geometry) => geometry.dispose());

          plumage.dispose();
          white.dispose();
          dark.dispose();
          flightFeathers.dispose();
          eyes.dispose();
          eyeWhite.dispose();
          eyeBlue.dispose();
          groundMaterial.dispose();
          sweatMaterial.dispose();
          renderer.dispose();
          renderer.domElement.remove();
          delete element.dataset.ready;
          delete element.dataset.phase;
          element.style.removeProperty("transform");
          control.current = () => {};
        };
      })
      .catch(() => {
        /* The existing illustration remains available without WebGL. */
      });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);
  return (
    <div
      className="k-magpie-model"
      ref={host}
      role="button"
      tabIndex={0}
      aria-label="Magpie flies across the hero and lands. After landing, click or press Enter for a playful reaction. Move your pointer or use arrow keys to turn its head."
      aria-keyshortcuts="Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
    >
      <img
        src={withBase("/illustrations/magpie/3d/magpie-front.png")}
        alt=""
        width="1254"
        height="1254"
      />
    </div>
  );
}
