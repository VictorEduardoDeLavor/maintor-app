import{r as p,j as f,C as I,u as V,B as b,a as g,S as W,V as _,b as S,d as y,A as E,M as w}from"./three-Cc-giAis.js";const A=5,x=24,d=2.5,j=1.8;function F(i){const e=Array.from({length:A},()=>new Float32Array(i*3)),c=new Float32Array(i),l=(o,t)=>o+Math.random()*(t-o),r=()=>(Math.random()+Math.random()+Math.random()-1.5)/1.5;for(let o=0;o<i;o++){c[o]=Math.random();const t=o*3;e[0][t+0]=.6+r()*4.2,e[0][t+1]=r()*2.8,e[0][t+2]=r()*2.4;{const a=o%3,n=l(-1,1),u=l(-1,1),h=[1.2,2.6,4][a],m=[.6,0,-.6][a],v=[-.35,0,.35][a],s=n*.95,M=0;e[1][t+0]=h+s*Math.cos(v)-M*Math.sin(v),e[1][t+1]=u*1.7,e[1][t+2]=m+s*Math.sin(v)}{const a=o/i,n=-6+a*12;e[2][t+0]=n+r()*.15,e[2][t+1]=Math.sin(a*Math.PI*3)*1.6+n*.12+r()*.3,e[2][t+2]=Math.cos(a*Math.PI*2)*.8+r()*.3}{const a=o%x,n=a/(x-1)*Math.PI,u=o/x%1*Math.PI*2+a*.26;e[3][t+0]=j+d*Math.sin(n)*Math.cos(u),e[3][t+1]=d*Math.cos(n),e[3][t+2]=d*Math.sin(n)*Math.sin(u)}{const a=Math.random(),n=Math.random(),u=a*Math.PI*2,h=Math.acos(2*n-1),m=1.15*Math.cbrt(Math.random());e[4][t+0]=2.6+m*Math.sin(h)*Math.cos(u),e[4][t+1]=.2+m*Math.cos(h),e[4][t+2]=m*Math.sin(h)*Math.sin(u)}}return{formas:e,seeds:c}}const R=`
  attribute vec3 aPos0; attribute vec3 aPos1; attribute vec3 aPos2;
  attribute vec3 aPos3; attribute vec3 aPos4;
  attribute float aSeed;
  uniform float uProgress;   // 0..4 contínuo entre as formações
  uniform float uTime;
  uniform vec2  uMouse;      // em unidades de mundo, plano z=0
  uniform float uPixelRatio;
  uniform float uWander;     // 1 = deriva viva, 0 = quieto (reduced motion)
  uniform float uVel;        // velocidade do scroll (Lenis), amortecida
  varying float vSeed;
  varying float vDepth;

  vec3 pegar(int i) {
    if (i == 0) return aPos0;
    if (i == 1) return aPos1;
    if (i == 2) return aPos2;
    if (i == 3) return aPos3;
    return aPos4;
  }

  void main() {
    float p = clamp(uProgress, 0.0, 3.999);
    int idx = int(floor(p));
    float f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    vec3 alvoA = pegar(idx);
    vec3 alvoB = pegar(idx + 1);
    float atraso = clamp(f * 1.3 - aSeed * 0.3, 0.0, 1.0);
    vec3 pos = mix(alvoA, alvoB, atraso);

    float t = uTime * 0.4 + aSeed * 40.0;
    pos += uWander * vec3(
      sin(t * 1.1) * 0.06,
      cos(t * 0.9) * 0.06,
      sin(t * 0.7) * 0.06
    ) * (0.5 + aSeed);

    vec2 delta = uMouse - pos.xy;
    float d = length(delta);
    pos.xy += normalize(delta + 0.0001) * smoothstep(2.2, 0.0, d) * 0.18 * uWander;

    // arrasto pelo scroll: o fluxo estica contra o movimento, elástico,
    // cada partícula com inércia própria (padrão Lusion/Unseen)
    pos.y += -uVel * 0.05 * (0.4 + aSeed * 0.9) * uWander;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aSeed * 2.8) * uPixelRatio * (6.0 / -mv.z);
    vSeed = aSeed;
    vDepth = smoothstep(-9.0, -3.0, mv.z);
  }
`,B=`
  uniform float uOpacity;
  varying float vSeed;
  varying float vDepth;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.05, d);
    vec3 mostarda = vec3(0.831, 0.647, 0.455);
    vec3 caramelo = vec3(0.722, 0.537, 0.353);
    vec3 creme    = vec3(0.980, 0.969, 0.949);
    vec3 cor = mix(caramelo, mostarda, smoothstep(0.2, 0.7, vSeed));
    cor = mix(cor, creme, step(0.93, vSeed));
    gl_FragColor = vec4(cor, alpha * uOpacity * (0.35 + 0.65 * vDepth));
  }
`;function z({progressoRef:i,mouseRef:e}){const c=p.useRef(),l=p.useMemo(()=>{const r=[];for(let t=0;t<x;t++){const a=t/(x-1)*Math.PI,n=36;for(let u=0;u<n;u++)for(const h of[u,u+1]){const m=h/n*Math.PI*2+t*.26;r.push(j+d*Math.sin(a)*Math.cos(m),d*Math.cos(a),d*Math.sin(a)*Math.sin(m))}}const o=new b;return o.setAttribute("position",new g(new Float32Array(r),3)),o},[]);return y((r,o)=>{const t=c.current;if(!t)return;const a=i.current*(A-1),n=w.smoothstep(a,2.55,3)*(1-w.smoothstep(a,3.05,3.6));t.material.opacity+=(n*.32-t.material.opacity)*Math.min(o*4,1),t.visible=t.material.opacity>.005,t.rotation.y+=o*.06}),f.jsx("lineSegments",{ref:c,geometry:l,frustumCulled:!1,children:f.jsx("lineBasicMaterial",{color:"#D4A574",transparent:!0,opacity:0,depthWrite:!1})})}function L({progressoRef:i,mouseRef:e,velocidadeRef:c,reduzido:l}){const r=p.useRef(),{size:o,viewport:t}=V(),a=o.width<768?2400:4200,{geometry:n,uniforms:u}=p.useMemo(()=>{const{formas:m,seeds:v}=F(a),s=new b;s.setAttribute("position",new g(m[0],3)),m.forEach((P,C)=>s.setAttribute(`aPos${C}`,new g(P,3))),s.setAttribute("aSeed",new g(v,1)),s.boundingSphere=new W(new _(0,0,0),12);const M={uProgress:{value:0},uTime:{value:0},uMouse:{value:new S(99,99)},uPixelRatio:{value:Math.min(window.devicePixelRatio,1.5)},uWander:{value:l?0:1},uOpacity:{value:.85},uVel:{value:0}};return{geometry:s,uniforms:M}},[a,l]),h=p.useRef(new S(99,99));return y((m,v)=>{const s=r.current.uniforms;s.uTime.value+=v;const M=i.current*(A-1);s.uProgress.value+=(M-s.uProgress.value)*Math.min(v*4.5,1);const P=w.clamp((c==null?void 0:c.current)??0,-30,30);s.uVel.value+=(P-s.uVel.value)*Math.min(v*6,1),c&&(c.current*=Math.max(0,1-v*4)),h.current.set(e.current.x*t.width/2,e.current.y*t.height/2),s.uMouse.value.lerp(h.current,.08)}),f.jsx("points",{geometry:n,frustumCulled:!1,children:f.jsx("shaderMaterial",{ref:r,vertexShader:R,fragmentShader:B,uniforms:u,transparent:!0,depthWrite:!1,blending:E})})}function O({mouseRef:i}){return y(({camera:e})=>{e.position.x+=(i.current.x*.35-e.position.x)*.04,e.position.y+=(i.current.y*.2-e.position.y)*.04,e.lookAt(.8,0,0)}),null}function D({progressoRef:i,velocidadeRef:e,reduzido:c}){const l=p.useRef({x:0,y:0});return p.useEffect(()=>{const r=o=>{l.current.x=o.clientX/window.innerWidth*2-1,l.current.y=-(o.clientY/window.innerHeight*2-1)};return window.addEventListener("pointermove",r,{passive:!0}),()=>window.removeEventListener("pointermove",r)},[]),f.jsx("div",{id:"canvas-root","aria-hidden":"true",children:f.jsxs(I,{camera:{position:[0,0,8],fov:50},dpr:Math.min(window.devicePixelRatio,1.5),gl:{antialias:!1,powerPreference:"high-performance",alpha:!0},children:[f.jsx(L,{progressoRef:i,mouseRef:l,velocidadeRef:e,reduzido:c}),f.jsx(z,{progressoRef:i,mouseRef:l}),!c&&f.jsx(O,{mouseRef:l})]})})}export{D as default};
