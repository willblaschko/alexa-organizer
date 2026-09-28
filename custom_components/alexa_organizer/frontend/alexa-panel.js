function e(e,t,i,o){var s,r=arguments.length,n=r<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,i,o);else for(var a=e.length-1;a>=0;a--)(s=e[a])&&(n=(r<3?s(n):r>3?s(t,i,n):s(t,i))||n);return r>3&&n&&Object.defineProperty(t,i,n),n}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let r=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=s.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&s.set(t,e))}return e}toString(){return this.cssText}};const n=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:a,defineProperty:d,getOwnPropertyDescriptor:l,getOwnPropertyNames:p,getOwnPropertySymbols:c,getPrototypeOf:h}=Object,m=globalThis,u=m.trustedTypes,f=u?u.emptyScript:"",_=m.reactiveElementPolyfillSupport,g=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?f:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},x=(e,t)=>!a(e,t),y={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=y){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&d(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:s}=l(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const r=o?.call(this);s?.call(this,t),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??y}static _$Ei(){if(this.hasOwnProperty(g("elementProperties")))return;const e=h(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(g("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(g("properties"))){const e=this.properties,t=[...p(e),...c(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),s=t.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(t,i.type);this._$Em=e,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:v;this._$Em=o;const r=s.fromAttribute(t,e.type);this[o]=r??this._$Ej?.get(o)??r,this._$Em=null}}requestUpdate(e,t,i,o=!1,s){if(void 0!==e){const r=this.constructor;if(!1===o&&(s=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??x)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:s},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==s||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[g("elementProperties")]=new Map,$[g("finalized")]=new Map,_?.({ReactiveElement:$}),(m.reactiveElementVersions??=[]).push("2.1.2");const b=globalThis,w=e=>e,A=b.trustedTypes,k=A?A.createPolicy("lit-html",{createHTML:e=>e}):void 0,C="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,H="?"+M,S=`<${H}>`,E=document,V=()=>E.createComment(""),L=e=>null===e||"object"!=typeof e&&"function"!=typeof e,P=Array.isArray,R="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,N=/>/g,z=RegExp(`>|${R}(?:([^\\s"'>=/]+)(${R}*=${R}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,j=/"/g,I=/^(?:script|style|textarea|title)$/i,D=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),B=Symbol.for("lit-noChange"),Z=Symbol.for("lit-nothing"),G=new WeakMap,W=E.createTreeWalker(E,129);function q(e,t){if(!P(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(t):t}const K=(e,t)=>{const i=e.length-1,o=[];let s,r=2===t?"<svg>":3===t?"<math>":"",n=O;for(let t=0;t<i;t++){const i=e[t];let a,d,l=-1,p=0;for(;p<i.length&&(n.lastIndex=p,d=n.exec(i),null!==d);)p=n.lastIndex,n===O?"!--"===d[1]?n=T:void 0!==d[1]?n=N:void 0!==d[2]?(I.test(d[2])&&(s=RegExp("</"+d[2],"g")),n=z):void 0!==d[3]&&(n=z):n===z?">"===d[0]?(n=s??O,l=-1):void 0===d[1]?l=-2:(l=n.lastIndex-d[2].length,a=d[1],n=void 0===d[3]?z:'"'===d[3]?j:U):n===j||n===U?n=z:n===T||n===N?n=O:(n=z,s=void 0);const c=n===z&&e[t+1].startsWith("/>")?" ":"";r+=n===O?i+S:l>=0?(o.push(a),i.slice(0,l)+C+i.slice(l)+M+c):i+M+(-2===l?t:c)}return[q(e,r+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class Y{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let s=0,r=0;const n=e.length-1,a=this.parts,[d,l]=K(e,t);if(this.el=Y.createElement(d,i),W.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=W.nextNode())&&a.length<n;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(C)){const t=l[r++],i=o.getAttribute(e).split(M),n=/([.?@])?(.*)/.exec(t);a.push({type:1,index:s,name:n[2],strings:i,ctor:"."===n[1]?ee:"?"===n[1]?te:"@"===n[1]?ie:Q}),o.removeAttribute(e)}else e.startsWith(M)&&(a.push({type:6,index:s}),o.removeAttribute(e));if(I.test(o.tagName)){const e=o.textContent.split(M),t=e.length-1;if(t>0){o.textContent=A?A.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],V()),W.nextNode(),a.push({type:2,index:++s});o.append(e[t],V())}}}else if(8===o.nodeType)if(o.data===H)a.push({type:2,index:s});else{let e=-1;for(;-1!==(e=o.data.indexOf(M,e+1));)a.push({type:7,index:s}),e+=M.length-1}s++}}static createElement(e,t){const i=E.createElement("template");return i.innerHTML=e,i}}function F(e,t,i=e,o){if(t===B)return t;let s=void 0!==o?i._$Co?.[o]:i._$Cl;const r=L(t)?void 0:t._$litDirective$;return s?.constructor!==r&&(s?._$AO?.(!1),void 0===r?s=void 0:(s=new r(e),s._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=s:i._$Cl=s),void 0!==s&&(t=F(e,s._$AS(e,t.values),s,o)),t}class J{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??E).importNode(t,!0);W.currentNode=o;let s=W.nextNode(),r=0,n=0,a=i[0];for(;void 0!==a;){if(r===a.index){let t;2===a.type?t=new X(s,s.nextSibling,this,e):1===a.type?t=new a.ctor(s,a.name,a.strings,this,e):6===a.type&&(t=new oe(s,this,e)),this._$AV.push(t),a=i[++n]}r!==a?.index&&(s=W.nextNode(),r++)}return W.currentNode=E,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=Z,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=F(this,e,t),L(e)?e===Z||null==e||""===e?(this._$AH!==Z&&this._$AR(),this._$AH=Z):e!==this._$AH&&e!==B&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>P(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==Z&&L(this._$AH)?this._$AA.nextSibling.data=e:this.T(E.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Y.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new J(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=G.get(e.strings);return void 0===t&&G.set(e.strings,t=new Y(e)),t}k(e){P(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const s of e)o===t.length?t.push(i=new X(this.O(V()),this.O(V()),this,this.options)):i=t[o],i._$AI(s),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Q{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,s){this.type=1,this._$AH=Z,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=Z}_$AI(e,t=this,i,o){const s=this.strings;let r=!1;if(void 0===s)e=F(this,e,t,0),r=!L(e)||e!==this._$AH&&e!==B,r&&(this._$AH=e);else{const o=e;let n,a;for(e=s[0],n=0;n<s.length-1;n++)a=F(this,o[i+n],t,n),a===B&&(a=this._$AH[n]),r||=!L(a)||a!==this._$AH[n],a===Z?e=Z:e!==Z&&(e+=(a??"")+s[n+1]),this._$AH[n]=a}r&&!o&&this.j(e)}j(e){e===Z?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends Q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===Z?void 0:e}}class te extends Q{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==Z)}}class ie extends Q{constructor(e,t,i,o,s){super(e,t,i,o,s),this.type=5}_$AI(e,t=this){if((e=F(this,e,t,0)??Z)===B)return;const i=this._$AH,o=e===Z&&i!==Z||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==Z&&(i===Z||o);o&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class oe{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){F(this,e)}}const se=b.litHtmlPolyfillSupport;se?.(Y,X),(b.litHtmlVersions??=[]).push("3.3.3");const re=globalThis;class ne extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const o=i?.renderBefore??t;let s=o._$litPart$;if(void 0===s){const e=i?.renderBefore??null;o._$litPart$=s=new X(t.insertBefore(V(),e),e,void 0,i??{})}return s._$AI(e),s})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}}ne._$litElement$=!0,ne.finalized=!0,re.litElementHydrateSupport?.({LitElement:ne});const ae=re.litElementPolyfillSupport;ae?.({LitElement:ne}),(re.litElementVersions??=[]).push("4.2.2");const de={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:x},le=(e=de,t,i)=>{const{kind:o,metadata:s}=i;let r=globalThis.litPropertyMetadata.get(s);if(void 0===r&&globalThis.litPropertyMetadata.set(s,r=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),r.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const s=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,s,e,!0,i)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const s=this[o];t.call(this,i),this.requestUpdate(o,s,e,!0,i)}}throw Error("Unsupported decorator location: "+o)};function pe(e){return(t,i)=>"object"==typeof i?le(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function ce(e){return pe({...e,state:!0,attribute:!1})}function he(e,t,i,o){const s=e=>e.trim().toLowerCase(),r=e.trim();if(!i.trim())return null;let n=r;const a=[...t].filter(e=>e.trim()).sort((e,t)=>t.length-e.length).find(e=>{const t=s(r),i=s(e);return t===i||t.startsWith(i+" ")});a&&(n=r.slice(a.trim().length).trim());const d=n?`${i.trim()} ${n}`:i.trim();if(s(d)===s(r))return null;const l=new Set([...o].map(s));if(l.delete(s(r)),!l.has(s(d)))return d;for(let e=2;;e++){const t=`${d} ${e}`;if(!l.has(s(t)))return t}}const me=["expose","create_room","rename_room","place","rename","preferred","remove","delete_room"];function ue(e){const t=e.action;switch(t.kind){case"expose":return"expose";case"room_op":return"create"===t.op?"create_room":"rename"===t.op?"rename_room":"delete_room";case"move":return"place";case"rename_device":return"rename";case"preferred":return"preferred";case"remove_device":case"remove_endpoint":return"remove"}}const fe={bulb:"M12,2A7,7 0 0,1 19,9C19,11.38 17.81,13.47 16,14.74V17A1,1 0 0,1 15,18H9A1,1 0 0,1 8,17V14.74C6.19,13.47 5,11.38 5,9A7,7 0 0,1 12,2M9,21V20H15V21A1,1 0 0,1 14,22H10A1,1 0 0,1 9,21M12,4A5,5 0 0,0 7,9C7,11.05 8.23,12.81 10,13.58V16H14V13.58C15.77,12.81 17,11.05 17,9A5,5 0 0,0 12,4Z",toggle:"M17 6H7C3.69 6 1 8.69 1 12S3.69 18 7 18H17C20.31 18 23 15.31 23 12S20.31 6 17 6M17 16H7C4.79 16 3 14.21 3 12S4.79 8 7 8H17C19.21 8 21 9.79 21 12S19.21 16 17 16M17 9C15.34 9 14 10.34 14 12S15.34 15 17 15 20 13.66 20 12 18.66 9 17 9Z",speaker:"M12,12A3,3 0 0,0 9,15A3,3 0 0,0 12,18A3,3 0 0,0 15,15A3,3 0 0,0 12,12M12,20A5,5 0 0,1 7,15A5,5 0 0,1 12,10A5,5 0 0,1 17,15A5,5 0 0,1 12,20M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8C10.89,8 10,7.1 10,6C10,4.89 10.89,4 12,4M17,2H7C5.89,2 5,2.89 5,4V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V4C19,2.89 18.1,2 17,2Z",tv:"M21,17H3V5H21M21,3H3A2,2 0 0,0 1,5V17A2,2 0 0,0 3,19H8V21H16V19H21A2,2 0 0,0 23,17V5A2,2 0 0,0 21,3Z",thermostat:"M16.95,16.95L14.83,14.83C15.55,14.1 16,13.1 16,12C16,11.26 15.79,10.57 15.43,10L17.6,7.81C18.5,9 19,10.43 19,12C19,13.93 18.22,15.68 16.95,16.95M12,5C13.57,5 15,5.5 16.19,6.4L14,8.56C13.43,8.21 12.74,8 12,8A4,4 0 0,0 8,12C8,13.1 8.45,14.1 9.17,14.83L7.05,16.95C5.78,15.68 5,13.93 5,12A7,7 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z",fan:"M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z",scene:"M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2C17.5,2 22,6 22,11A6,6 0 0,1 16,17H14.2C13.9,17 13.7,17.2 13.7,17.5C13.7,17.6 13.8,17.7 13.8,17.8C14.2,18.3 14.4,18.9 14.4,19.5C14.5,20.9 13.4,22 12,22M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C12.3,20 12.5,19.8 12.5,19.5C12.5,19.3 12.4,19.2 12.4,19.1C12,18.6 11.8,18.1 11.8,17.5C11.8,16.1 12.9,15 14.3,15H16A4,4 0 0,0 20,11C20,7.1 16.4,4 12,4M6.5,10C7.3,10 8,10.7 8,11.5C8,12.3 7.3,13 6.5,13C5.7,13 5,12.3 5,11.5C5,10.7 5.7,10 6.5,10M9.5,6C10.3,6 11,6.7 11,7.5C11,8.3 10.3,9 9.5,9C8.7,9 8,8.3 8,7.5C8,6.7 8.7,6 9.5,6M14.5,6C15.3,6 16,6.7 16,7.5C16,8.3 15.3,9 14.5,9C13.7,9 13,8.3 13,7.5C13,6.7 13.7,6 14.5,6M17.5,10C18.3,10 19,10.7 19,11.5C19,12.3 18.3,13 17.5,13C16.7,13 16,12.3 16,11.5C16,10.7 16.7,10 17.5,10Z",script:"M15,20A1,1 0 0,0 16,19V4H8A1,1 0 0,0 7,5V16H5V5A3,3 0 0,1 8,2H19A3,3 0 0,1 22,5V6H20V5A1,1 0 0,0 19,4A1,1 0 0,0 18,5V9L18,19A3,3 0 0,1 15,22H5A3,3 0 0,1 2,19V18H13A2,2 0 0,0 15,20M9,6H14V8H9V6M9,10H14V12H9V10M9,14H14V16H9V14Z",cover:"M20 19V3H4V19H2V21H22V19H20M16 9H18V11H16V9M14 11H6V9H14V11M18 7H16V5H18V7M14 5V7H6V5H14M6 19V13H14V14.82C13.55 15.14 13.25 15.66 13.25 16.25C13.25 17.22 14.03 18 15 18S16.75 17.22 16.75 16.25C16.75 15.66 16.45 15.13 16 14.82V13H18V19H6Z",vacuum:"M12,2C14.65,2 17.19,3.06 19.07,4.93L17.65,6.35C16.15,4.85 14.12,4 12,4C9.88,4 7.84,4.84 6.35,6.35L4.93,4.93C6.81,3.06 9.35,2 12,2M3.66,6.5L5.11,7.94C4.39,9.17 4,10.57 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,10.57 19.61,9.17 18.88,7.94L20.34,6.5C21.42,8.12 22,10.04 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12C2,10.04 2.58,8.12 3.66,6.5M12,6A6,6 0 0,1 18,12C18,13.59 17.37,15.12 16.24,16.24L14.83,14.83C14.08,15.58 13.06,16 12,16C10.94,16 9.92,15.58 9.17,14.83L7.76,16.24C6.63,15.12 6,13.59 6,12A6,6 0 0,1 12,6M12,8A1,1 0 0,0 11,9A1,1 0 0,0 12,10A1,1 0 0,0 13,9A1,1 0 0,0 12,8Z",lock:"M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",camera:"M6.03 12.03L8.03 15.5L5.5 18.68L2 12.62L6.03 12.03M17 18V15.29C17.88 14.9 18.5 14.03 18.5 13C18.5 12.43 18.3 11.9 17.97 11.5L19.94 10.35C20.95 9.76 21.3 8.47 20.71 7.46L19.33 5.06C18.74 4.05 17.45 3.7 16.44 4.28L8.31 9C7.36 9.53 7.03 10.75 7.58 11.71L9.08 14.31C9.63 15.26 10.86 15.59 11.81 15.04L13.69 13.96C13.94 14.55 14.41 15.03 15 15.29V18C15 19.1 15.9 20 17 20H22V18H17Z",phone:"M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z",device:"M3 6H21V4H3C1.9 4 1 4.9 1 6V18C1 19.1 1.9 20 3 20H7V18H3V6M13 12H9V13.78C8.39 14.33 8 15.11 8 16C8 16.89 8.39 17.67 9 18.22V20H13V18.22C13.61 17.67 14 16.88 14 16S13.61 14.33 13 13.78V12M11 17.5C10.17 17.5 9.5 16.83 9.5 16S10.17 14.5 11 14.5 12.5 15.17 12.5 16 11.83 17.5 11 17.5M22 8H16C15.5 8 15 8.5 15 9V19C15 19.5 15.5 20 16 20H22C22.5 20 23 19.5 23 19V9C23 8.5 22.5 8 22 8M21 18H17V10H21V18Z",check:"M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z",chevron:"M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",note:"M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17S7.79 21 10 21 14 19.21 14 17V7H18V3H12Z",trash:"M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z",refresh:"M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",close:"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",alert:"M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z",arrow:"M14 16.94V12.94H5.08L5.05 10.93H14V6.94L19 11.94Z",sync:"M12,18A6,6 0 0,1 6,12C6,11 6.25,10.03 6.7,9.2L5.24,7.74C4.46,8.97 4,10.43 4,12A8,8 0 0,0 12,20V23L16,19L12,15M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13 17.75,13.97 17.3,14.8L18.76,16.26C19.54,15.03 20,13.57 20,12A8,8 0 0,0 12,4Z",home:"M12 5.69L17 10.19V18H15V12H9V18H7V10.19L12 5.69M12 3L2 12H5V20H11V14H13V20H19V12H22",pencil:"M14.06,9L15,9.94L5.92,19H5V18.08L14.06,9M17.66,3C17.41,3 17.15,3.1 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18.17,3.09 17.92,3 17.66,3M14.06,6.19L3,17.25V21H6.75L17.81,9.94L14.06,6.19Z",plus:"M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z",eyeoff:"M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.3 13.28,19.5 12,19.5C7,19.5 2.73,16.39 1,12C1.69,10.24 2.79,8.69 4.19,7.46L2,5.27M12,9A3,3 0 0,1 15,12C15,12.35 14.94,12.69 14.83,13L11,9.17C11.31,9.06 11.65,9 12,9M12,4.5C17,4.5 21.27,7.61 23,12C22.18,14.08 20.79,15.88 19,17.19L17.58,15.76C18.94,14.82 20.06,13.54 20.82,12C19.17,8.64 15.76,6.5 12,6.5C10.91,6.5 9.84,6.68 8.84,7L7.3,5.47C8.74,4.85 10.33,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C12.69,17.5 13.37,17.43 14,17.29L11.72,15C10.29,14.85 9.15,13.71 9,12.28L5.6,8.87C4.61,9.72 3.78,10.78 3.18,12Z",door:"M12,3C10.89,3 10,3.89 10,5H3V19H2V21H22V19H21V5C21,3.89 20.11,3 19,3H12M12,5H19V19H12V5M5,11H7V13H5V11Z"},_e=[{label:"Lighting",domains:["light","switch"]},{label:"Media",domains:["media_player"]},{label:"Climate",domains:["climate","fan"]},{label:"Scenes & routines",domains:["scene","script"]},{label:"Other",domains:["cover","vacuum","lock","camera","input_boolean"]}],ge={};_e.forEach((e,t)=>e.domains.forEach(e=>ge[e]=t));const ve=e=>ge[e]??_e.length-1,xe=e=>(e.manufacturer??"").toLowerCase().includes("amazon"),ye=(e,t="")=>D`<svg class="ic ${t}" viewBox="0 0 24 24" aria-hidden="true"><path d=${fe[e]}></path></svg>`,$e={light:"bulb",switch:"toggle",input_boolean:"toggle",media_player:"speaker",climate:"thermostat",fan:"fan",scene:"scene",script:"script",cover:"cover",vacuum:"vacuum",lock:"lock",camera:"camera"},be={LIGHT:"bulb",SWITCH:"toggle",SMARTPLUG:"toggle",TV:"tv",STREAMING_DEVICE:"tv",GAME_CONSOLE:"tv",SPEAKER:"speaker",ALEXA_VOICE_ENABLED:"speaker",THERMOSTAT:"thermostat",FAN:"fan",SCENE_TRIGGER:"scene",ACTIVITY_TRIGGER:"scene",INTERIOR_BLIND:"cover",EXTERIOR_BLIND:"cover",VACUUM_CLEANER:"vacuum",SMARTLOCK:"lock",CAMERA:"camera",PHONE:"phone",MOBILE_PHONE:"phone"},we={expose:"eyeoff",rooms:"home",place:"arrow",rename:"pencil",speakers:"note",cleanup_devices:"trash",cleanup_endpoints:"trash",rooms_delete:"trash"},Ae=D`<svg class="brand" viewBox="0 0 512 512" aria-hidden="true">
  <rect width="512" height="512" rx="112" fill="#0d1628"/>
  <path d="M256 92 L420 222 L420 408 L92 408 L92 222 Z" fill="#2c3368" stroke="#2c3368" stroke-width="36" stroke-linejoin="round"/>
  <rect x="128" y="238" width="118" height="70" rx="18" fill="#4a86ff"/><rect x="266" y="238" width="118" height="70" rx="18" fill="#1fc6c4"/>
  <rect x="128" y="328" width="118" height="70" rx="18" fill="#8f7ef7"/><rect x="266" y="328" width="118" height="70" rx="18" fill="#4a86ff"/>
  <rect x="219" y="168" width="18" height="44" rx="9" fill="#4a86ff"/><rect x="247" y="152" width="18" height="60" rx="9" fill="#1fc6c4"/>
  <rect x="275" y="176" width="18" height="36" rx="9" fill="#8f7ef7"/>
</svg>`;let ke=class extends ne{constructor(){super(...arguments),this.narrow=!1,this._plan=null,this._planBusy=!1,this._accepted=new Set,this._reviewOpen=!1,this._opStatus={},this._applying=!1,this._userMove={},this._userPref={},this._userRemove={},this._expandedGroups=new Set,this._openRow=null,this._applyTotal=0,this._lastErrors=0,this._justSynced=!1}connectedCallback(){super.connectedCallback(),this._loadPlan()}render(){const e=Object.keys(this._userMove).length+Object.keys(this._userPref).length+Object.keys(this._userRemove).length;return D`
      <div class="wrap">
        <header class="top">
          ${this.narrow?D`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>`:Z}
          ${Ae}
          <div class="titles">
            <h1>Alexa Organizer</h1>
            <p class="sub">Home Assistant is your house. This keeps Alexa matched to it.</p>
          </div>
          <button
            class="iconbtn"
            title=${e?"Sync or undo your edits before checking again":"Check Alexa again"}
            ?disabled=${this._planBusy||this._applying||e>0}
            @click=${()=>this._loadPlan()}
          >
            ${ye("refresh",this._planBusy&&this._plan?"spin":"")}
          </button>
        </header>
        ${this._planView()}
      </div>
      ${this._reviewOpen?this._reviewSheet():Z}
    `}async _loadPlan(){if(!this._planBusy){this._planBusy=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/plan"});this._plan=e;const t=new Set((e.groups??[]).flatMap(e=>e.ops).filter(e=>e.suggested).map(e=>e.id));for(const i of this._renameOps(e.groups??[],t))t.add(i.id);this._accepted=t,this._opStatus={},this._userMove={},this._userPref={},this._userRemove={}}finally{this._planBusy=!1}}}_toggleOp(e){const t=new Set(this._accepted);t.has(e)?t.delete(e):t.add(e),this._accepted=t}get _acceptedCount(){const e=new Set(this._effectiveGroups().flatMap(e=>e.ops).map(e=>e.id));let t=0;for(const i of this._accepted)e.has(i)&&t++;return t}_endpointCurrentRoom(){const e=new Map,t=this._plan?.board;for(const i of t?.rooms??[])for(const t of i.devices)t.endpoint_id&&e.set(t.endpoint_id,i.id??"");for(const i of t?.unroomed??[])i.endpoint_id&&e.set(i.endpoint_id,"");return e}_twinsOf(e){const t=this._plan?.board;for(const i of[...(t?.rooms??[]).flatMap(e=>e.devices),...t?.unroomed??[]])if(i.endpoint_id===e)return i.twins??[];return[]}_deviceName(e){const t=this._plan?.board;for(const i of[...(t?.rooms??[]).flatMap(e=>e.devices),...t?.unroomed??[]])if(i.endpoint_id===e)return i.name;return e}_norm(e){return(e||"").trim().toLowerCase()}_areaHasRoom(e){return(this._plan?.board.rooms??[]).some(t=>!!t.id&&this._norm(t.name)===this._norm(e))}_effectiveGroups(){const e=this._mergedGroups(),t=this._renameOps(e,this._accepted);if(!t.length)return e;const i=[...e],o=i.findIndex(e=>"place"===e.key);return i.splice(o>=0?o+1:i.length,0,{key:"rename",title:"Rename Echos to match their room",destructive:!1,ops:t}),i}_renameOps(e,t){const i=this._plan?.board;if(!i)return[];const o=[...(i.rooms??[]).flatMap(e=>e.devices),...i.unroomed??[]],s=new Map(o.filter(e=>e.endpoint_id).map(e=>[e.endpoint_id,e])),r=(i.rooms??[]).map(e=>e.name),n=new Map((i.rooms??[]).filter(e=>e.id).map(e=>[e.id,e.name])),a=new Set(o.map(e=>e.name)),d=[];for(const i of e.flatMap(e=>e.ops)){const e=i.action;if("move"!==e.kind||!e.endpoint_id||!t.has(i.id))continue;const o=s.get(e.endpoint_id);if(!o||!xe(o)||!o.is_speaker)continue;const l=e.to&&n.get(e.to)||e.area||"",p=he(o.name,r,l,a);p&&(a.add(p),d.push({id:`rename:${e.endpoint_id}`,group:"rename",title:`Rename ${o.name} → ${p}`,detail:"",suggested:!0,destructive:!1,action:{kind:"rename_device",endpoint_id:e.endpoint_id,name:p}}))}return d}_mergedGroups(){const e=this._plan?.groups??[],t=Object.keys(this._userMove),i=Object.keys(this._userPref),o=Object.values(this._userRemove);if(0===t.length&&0===i.length&&0===o.length)return e;const s=this._endpointCurrentRoom(),r=[],n=[];for(const[e,t]of Object.entries(this._userMove)){const i=s.get(e)??"";if(t!==i)if(t.startsWith("#area#")){const o=t.slice(6);r.push({id:`move:${e}`,group:"place",title:`Put ${this._deviceName(e)} in ${o}`,detail:this._areaHasRoom(o)?"":"creates the room",suggested:!0,destructive:!1,action:{kind:"move",endpoint_id:e,from:i||null,to:"",area:o}}),this._areaHasRoom(o)||n.some(e=>e.id===`room:create:${o}`)||n.push({id:`room:create:${o}`,group:"rooms",title:`Create room ${o}`,detail:"for its devices",suggested:!0,destructive:!1,action:{kind:"room_op",op:"create",name:o}})}else r.push({id:`move:${e}`,group:"place",title:`Move ${this._deviceName(e)}`,detail:"",suggested:!0,destructive:!1,action:{kind:"move",endpoint_id:e,from:i||null,to:t}})}const a=i.map(e=>({id:`pref:${e}`,group:"speakers",title:`Set the main speaker in ${this._roomName(e)}`,detail:"",suggested:!0,destructive:!1,action:{kind:"preferred",room_id:e,endpoint_id:this._userPref[e]}})),d=new Set(i),l=new Map;for(const e of o)(l.get(e.group)??l.set(e.group,[]).get(e.group)).push(e);const p=new Set(o.map(e=>e.id)),c={cleanup_devices:"Delete devices",cleanup_endpoints:"Delete from Alexa",expose:"Exposure"},h=new Set(t),m=new Set(e.flatMap(e=>e.ops).map(e=>e.id)),u=n.filter(e=>!m.has(e.id)),f=new Set;let _=!1,g=!1;const v=(e,t)=>{const i=l.get(e.key);return i?(f.add(e.key),[...t.filter(e=>!p.has(e.id)),...i]):t},x=e.map(e=>"rooms"===e.key?{...e,ops:v(e,[...e.ops,...u])}:"speakers"===e.key?(g=!0,{...e,ops:v(e,[...e.ops.filter(e=>!(e=>"preferred"===e.action.kind&&!!e.action.room_id&&d.has(e.action.room_id))(e)),...a])}):"place"===e.key?(_=!0,{...e,ops:v(e,[...e.ops.filter(e=>!(e=>"move"===e.action.kind&&!!e.action.endpoint_id&&h.has(e.action.endpoint_id))(e)),...r])}):{...e,ops:v(e,e.ops)});!e.some(e=>"rooms"===e.key)&&u.length&&x.unshift({key:"rooms",title:"Rooms",destructive:!1,ops:u}),!_&&r.length&&x.push({key:"place",title:"Put devices in their room",destructive:!1,ops:r}),!g&&a.length&&x.push({key:"speakers",title:"Preferred speaker",destructive:!1,ops:a});for(const[e,t]of l)f.has(e)||x.push({key:e,title:c[e]??"Remove",destructive:!0,ops:t});return x}_roomName(e){return(this._plan?.board.rooms??[]).find(t=>t.id===e)?.name??e}_effectivePreferred(e){if(e.id&&e.id in this._userPref)return this._userPref[e.id];const t=(this._plan?.groups??[]).flatMap(e=>e.ops).find(t=>"preferred"===t.action.kind&&t.action.room_id===e.id&&this._accepted.has(t.id));return t?t.action.endpoint_id:e.preferred_id}_onSetPreferred(e,t){this._userPref={...this._userPref,[e]:t},this._accepted=new Set(this._accepted).add(`pref:${e}`)}_homeRooms(){return(this._plan?.board.rooms??[]).filter(e=>e.id||e.in_ha).map(e=>({value:e.id||`#area#${e.name}`,name:e.name}))}_removalOps(e){const t=(e,t)=>({id:`expose:${e}`,group:"expose",title:t,detail:"removes the Home Assistant copy",suggested:!0,destructive:!0,action:{kind:"expose",entity_id:e,to:!1}});if("ha"===e.source&&e.entity_id)return[t(e.entity_id,`Stop sending ${e.name} to Alexa`)];if(!e.endpoint_id)return[];const i=["echo"===e.source?{id:`rmdev:${e.endpoint_id}`,group:"cleanup_devices",title:`Delete ${e.name}`,detail:"removes this device from Alexa",suggested:!0,destructive:!0,action:{kind:"remove_device",endpoint_id:e.endpoint_id}}:{id:`rmep:${e.endpoint_id}`,group:"cleanup_endpoints",title:`Delete ${e.name}`,detail:"removes this from Alexa",suggested:!0,destructive:!0,action:{kind:"remove_endpoint",endpoint_id:e.endpoint_id}}];return e.twin_entity_id&&i.push(t(e.twin_entity_id,`Stop sending ${e.name}'s Home Assistant copy`)),i}_onRemove(e){const t=this._removalOps(e);if(!t.length)return;const i={...this._userRemove},o=new Set(this._accepted),s=!(t[0].id in i);for(const e of t)s?(i[e.id]=e,o.add(e.id)):(delete i[e.id],o.delete(e.id));this._userRemove=i,this._accepted=o}_onHomeMove(e,t){const i=this._endpointCurrentRoom().get(e)??"";this._userMove={...this._userMove,[e]:t};const o=new Set(this._accepted),s=`move:${e}`;if(t===i?o.delete(s):o.add(s),t.startsWith("#area#")){const e=t.slice(6);this._areaHasRoom(e)||o.add(`room:create:${e}`)}const r=`rename:${e}`;o.delete(r),t!==i&&this._renameOps(this._mergedGroups(),o).some(e=>e.id===r)&&o.add(r),this._accepted=o}_planEndpointCount(){const e=this._plan?.board.rooms??[],t=this._plan?.board.unroomed??[];return e.reduce((e,t)=>e+t.devices.filter(e=>e.endpoint_id).length,0)+t.filter(e=>e.endpoint_id).length}async _applyPlan(){if(this._applying||!this._plan)return;this._applying=!0;const e=this._plan,t=e=>(e||"").trim().toLowerCase(),i=(e,t)=>this.hass.callService("alexa_organizer",e,t),o=e=>this.hass.connection.sendMessagePromise(e),s=(e,t)=>this._opStatus={...this._opStatus,[e]:t},r=async(e,t)=>{s(e,"running");try{await t(),s(e,"done")}catch{s(e,"error")}};try{const n=this._effectiveGroups().flatMap(e=>e.ops).filter(e=>this._accepted.has(e.id));this._applyTotal=n.length,this._lastErrors=0,this._justSynced=!1;const a=n.some(e=>"expose"===e.action.kind&&!0===e.action.to),d=new Map;for(const i of e.board.rooms??[])i.id&&d.set(t(i.name),i.id);for(const{lane:e,ops:a}of function(e){const t=new Map;for(const i of e){const e=ue(i),o=t.get(e);o?o.push(i):t.set(e,[i])}return me.filter(e=>t.has(e)).map(e=>({lane:e,ops:t.get(e)}))}(n))if("expose"===e){const e=this._effectiveGroups().flatMap(e=>e.ops).filter(e=>"expose"===e.action.kind);a.forEach(e=>s(e.id,"running"));try{for(const t of e){const e=this._accepted.has(t.id)?t.action.to:!t.action.to;await o({type:"alexa_organizer/set",entity_id:t.action.entity_id,expose:e})}await o({type:"alexa_organizer/apply",force:!0}),a.forEach(e=>s(e.id,"done"))}catch{a.forEach(e=>s(e.id,"error"))}}else if("create_room"===e)await Promise.all(a.map(e=>r(e.id,async()=>{const i=await o({type:"alexa_organizer/create_room",name:e.action.name});if(!i.ok||!i.id)throw new Error(i.reason||"create failed");d.set(t(e.action.name),i.id)})));else if("rename_room"===e)await Promise.all(a.map(e=>r(e.id,()=>i("room_op",{action:"rename",id:e.action.id,name:e.action.name}))));else if("place"===e)await Promise.all(a.map(e=>r(e.id,()=>{const o=e.action;let s=o.to||"";if(!s&&o.area&&(s=d.get(t(o.area))??"",!s))throw new Error("room not created");const r=(e,t)=>{const o={endpoint_id:e};return t&&(o.from=t),s&&(o.to=s),i("move_device",o)};return(async()=>{await r(o.endpoint_id,o.from);for(const e of this._twinsOf(o.endpoint_id))(e.room_id??"")!==s&&await r(e.endpoint_id,e.room_id)})()})));else if("rename"===e)await Promise.all(a.map(e=>r(e.id,()=>i("rename_device",{endpoint_id:e.action.endpoint_id,name:e.action.name}))));else if("preferred"===e)await Promise.all(a.map(e=>r(e.id,()=>i("set_preferred_speaker",{room_id:e.action.room_id,endpoint_id:e.action.endpoint_id}))));else if("remove"===e){const e=a.filter(e=>"remove_device"===e.action.kind),t=a.filter(e=>"remove_endpoint"===e.action.kind);if(e.length){e.forEach(e=>s(e.id,"running"));try{await i("alexa_devices",{apply:!0,endpoint_ids:e.map(e=>e.action.endpoint_id)}),e.forEach(e=>s(e.id,"done"))}catch{e.forEach(e=>s(e.id,"error"))}}await Promise.all(t.map(e=>r(e.id,()=>i("forget_endpoint",{endpoint_id:e.action.endpoint_id}))))}else"delete_room"===e&&await Promise.all(a.map(e=>r(e.id,()=>i("room_op",{action:"delete",id:e.action.id}))));if(this._lastErrors=Object.values(this._opStatus).filter(e=>"error"===e).length,a){const e=this._planEndpointCount();for(let t=0;t<12&&(await new Promise(e=>setTimeout(e,4e3)),await this._loadPlan(),!(this._planEndpointCount()>e));t++);}else await this._loadPlan();this._reviewOpen=!1,this._openRow=null,this._lastErrors||(this._justSynced=!0,setTimeout(()=>this._justSynced=!1,6e3))}finally{this._applying=!1}}_planView(){const e=this._plan;return e?D`
      ${this._hero()}
      ${e.available?Z:D`<div class="notice">
            ${ye("alert")}
            <span>
              <b>Alexa isn't connected.</b> Sign in to Alexa Media Player or Alexa Devices in Home
              Assistant to organize rooms and speakers. Until then, this only manages what Alexa sees.
            </span>
          </div>`}
      ${this._planBoard()}
    `:this._skeleton()}_skeleton(){const e=e=>D`
      <section class="room skel-card">
        <div class="skel skel-title"></div>
        ${Array.from({length:e},()=>D`<div class="skel-row"><div class="skel skel-dot"></div><div class="skel skel-line"></div></div>`)}
      </section>`;return D`
      <div class="hero"><div class="skel skel-medal"></div><div class="herotext"><div class="skel skel-title"></div><div class="skel skel-line short"></div></div></div>
      <div class="rooms">${e(4)}${e(2)}${e(3)}${e(5)}${e(2)}${e(3)}</div>
    `}_hero(){const e=this._plan,t=this._acceptedCount;if(this._applying){const e=Object.values(this._opStatus).filter(e=>"done"===e||"error"===e).length,t=Math.max(this._applyTotal,1);return D`
        <div class="hero busy">
          <div class="medal m-accent">${ye("sync","spin")}</div>
          <div class="herotext">
            <div class="herotitle">Syncing with Alexa…</div>
            <div class="herosub">${Math.min(e,t)} of ${t} done</div>
            <div class="progress"><span style="width:${Math.min(e,t)/t*100}%"></span></div>
          </div>
        </div>`}if(this._lastErrors>0&&t>0)return D`
        <div class="hero">
          <div class="medal m-warn">${ye("alert")}</div>
          <div class="herotext">
            <div class="herotitle">${this._lastErrors} change${1===this._lastErrors?"":"s"} didn't go through</div>
            <div class="herosub">They're still in the plan — give them another try.</div>
          </div>
          <button class="primary" @click=${()=>this._reviewOpen=!0}>Review &amp; Sync</button>
        </div>`;if(0===t){const e=this._houseCounts();return D`
        <div class="hero ${this._justSynced?"celebrate":""}">
          <div class="medal m-ok">${ye("check")}</div>
          <div class="herotext">
            <div class="herotitle">${this._justSynced?"Done — Alexa matches your house":"Alexa matches your house"}</div>
            <div class="herosub">${e.rooms} rooms · ${e.devices} devices</div>
          </div>
        </div>`}return D`
      <div class="hero">
        <div class="medal m-accent"><span class="medalnum">${t}</span></div>
        <div class="herotext">
          <div class="herotitle">${t} change${1===t?"":"s"} to make Alexa match your house</div>
          <div class="herosub">${this._changeSummary()}</div>
        </div>
        <button class="primary" ?disabled=${!e} @click=${()=>this._reviewOpen=!0}>Review &amp; Sync</button>
      </div>`}_changeSummary(){const e={expose:["exposure change","exposure changes"],rooms:["room","rooms"],place:["move","moves"],rename:["rename","renames"],speakers:["speaker","speakers"],cleanup:["removal","removals"],rooms_delete:["room to delete","rooms to delete"]},t=new Map;for(const e of this._effectiveGroups()){const i=e.key.startsWith("cleanup_")?"cleanup":e.key,o=e.ops.filter(e=>this._accepted.has(e.id)).length;o&&t.set(i,(t.get(i)??0)+o)}return[...t].map(([t,i])=>`${i} ${(e[t]??["change","changes"])[1===i?0:1]}`).join(" · ")}_houseCounts(){const e=this._plan?.board,t=(e?.rooms??[]).filter(e=>e.id).length,i=[...(e?.rooms??[]).flatMap(e=>e.devices),...e?.unroomed??[]].filter(e=>e.endpoint_id).length;return{rooms:t,devices:i}}_reviewSheet(){const e=this._acceptedCount,t=()=>!this._applying&&(this._reviewOpen=!1);return D`
      <div class="scrim" @click=${t}></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Review changes">
        <div class="sheethead">
          <div>
            <h2>Review changes</h2>
            <div class="herosub">Untick anything you don't want. Nothing changes until you sync.</div>
          </div>
          <button class="iconbtn" title="Close" ?disabled=${this._applying} @click=${t}>${ye("close")}</button>
        </div>
        <div class="sheetbody">${this._effectiveGroups().map(e=>this._reviewGroup(e))}</div>
        <div class="sheetfoot">
          <button class="primary wide" ?disabled=${this._applying||0===e} @click=${this._applyPlan}>
            ${this._applying?"Syncing…":`Sync ${e} change${1===e?"":"s"}`}
          </button>
        </div>
      </div>
    `}_toggleGroupExpand(e){const t=new Set(this._expandedGroups);t.has(e)?t.delete(e):t.add(e),this._expandedGroups=t}_toggleGroup(e,t){const i=new Set(this._accepted);for(const o of e.ops)t?i.add(o.id):i.delete(o.id);this._accepted=i}_reviewGroup(e){const t=e.ops.length,i=e.ops.filter(e=>this._accepted.has(e.id)).length,o=this._expandedGroups.has(e.key);return D`
      <div class="rgroup ${e.destructive?"danger":""} ${o?"open":""}">
        <div class="rghead">
          <input
            type="checkbox"
            aria-label="Include all: ${e.title}"
            .checked=${i===t&&t>0}
            .indeterminate=${i>0&&i<t}
            ?disabled=${this._applying}
            @change=${t=>this._toggleGroup(e,t.target.checked)}
          />
          <button class="rgtitle" aria-expanded=${o} @click=${()=>this._toggleGroupExpand(e.key)}>
            <span class="rgicon">${ye(we[e.key]??"device")}</span>
            <span class="rgname">${e.title}</span>
            <span class="rgcount">${i===t?t:`${i} of ${t}`}</span>
            ${ye("chevron","chev")}
          </button>
        </div>
        ${o?D`<div class="rgbody">
              ${e.ops.map(e=>D`
                  <label class="rop">
                    ${this._statusDisc(this._opStatus[e.id])}
                    <input
                      type="checkbox"
                      .checked=${this._accepted.has(e.id)}
                      ?disabled=${this._applying}
                      @change=${()=>this._toggleOp(e.id)}
                    />
                    <span class="roptext">
                      <span class="roptitle">${e.title}</span>
                      ${e.detail?D`<span class="ropdetail">${e.detail}</span>`:Z}
                    </span>
                  </label>
                `)}
            </div>`:Z}
      </div>
    `}_planBoard(){const e=function(e,t,i){const o=e=>(e||"").trim().toLowerCase(),s={},r={},n=new Set,a=new Map,d=new Map,l=new Set;for(const e of t)for(const t of e.ops){if(!i.has(t.id))continue;const e=t.action;"move"===e.kind&&e.endpoint_id?e.to?s[e.endpoint_id]=e.to:e.area?r[e.endpoint_id]=o(e.area):s[e.endpoint_id]="":"remove_device"!==e.kind&&"remove_endpoint"!==e.kind||!e.endpoint_id?"rename_device"===e.kind&&e.endpoint_id&&e.name?a.set(e.endpoint_id,e.name):"expose"===e.kind&&e.entity_id?d.set(e.entity_id,e.to):"room_op"===e.kind&&"create"===e.op&&e.name&&l.add(o(e.name)):n.add(e.endpoint_id)}const p=function(e,t,i){const o=e=>!!e.endpoint_id&&e.endpoint_id in i,s=e=>i[e.endpoint_id],r=[...e.flatMap(e=>e.devices),...t].filter(o),n=e.map(e=>{const t=e.devices.filter(t=>!o(t)||s(t)===e.id),i=r.filter(t=>s(t)===e.id&&!e.devices.includes(t));return{...e,devices:[...t,...i]}}),a=[...t.filter(e=>!o(e)||""===s(e)),...r.filter(e=>""===s(e)&&!t.includes(e))];return{rooms:n,unroomed:a}}(e.rooms??[],e.unroomed??[],s),c=new Map(p.rooms.map(e=>[o(e.name),e])),h=e=>{for(const t of p.rooms){const i=t.devices.findIndex(t=>t.endpoint_id===e);if(i>=0)return t.devices.splice(i,1)[0]}const t=p.unroomed.findIndex(t=>t.endpoint_id===e);return t>=0?p.unroomed.splice(t,1)[0]:void 0};for(const[e,t]of Object.entries(r)){const i=h(e);if(!i)continue;const o=c.get(t);o?o.devices.push(i):p.unroomed.push(i)}const m=e=>({...e,name:e.endpoint_id&&a.get(e.endpoint_id)||e.name,_removing:!!e.endpoint_id&&n.has(e.endpoint_id),exposed:e.entity_id&&d.has(e.entity_id)?d.get(e.entity_id):e.exposed});return{rooms:p.rooms.map(e=>({...e,_creating:e._creating||l.has(o(e.name)),devices:e.devices.map(m)})),unroomed:p.unroomed.map(m)}}(this._plan.board,this._effectiveGroups(),this._accepted);return D`
      <div class="rooms">
        ${e.rooms.map(e=>this._previewRoom(e))}
        ${e.unroomed.length?this._previewRoom({id:null,name:"Not in a room",in_alexa:!1,in_ha:!1,preferred_id:null,devices:e.unroomed},!0):Z}
      </div>
    `}_previewRoom(e,t=!1){const i=this._boardBuckets(e.devices),o=i.reduce((e,t)=>e+t.devices.length,0),s=t?D`<span class="rtag">Alexa can't reach these by room</span>`:e._creating?D`<span class="rtag new">New room</span>`:!e.id&&e.in_ha?D`<span class="rtag">Not in Alexa yet</span>`:e.id&&!e.in_ha?D`<span class="rtag">Only in Alexa</span>`:Z;return D`
      <section class="room ${t?"unroomed":""}">
        <header class="roomhead">
          <h2>${e.name}</h2>
          <span class="rcount">${o}</span>
          ${s}
        </header>
        ${0===o?D`<p class="empty">Nothing here yet.</p>`:Z}
        ${i.map(t=>D`
            <div class="group kind-${t.kind}">
              <h3>${t.label}</h3>
              ${t.devices.map(t=>this._deviceRow(t,e))}
            </div>
          `)}
      </section>
    `}_toggleRow(e){this._openRow=this._openRow===e?null:e}_deviceRow(e,t){const i=e.endpoint_id??e.entity_id??e.name,o=this._openRow===i,s=t.id??(t.in_ha?`#area#${t.name}`:""),r=e.is_speaker&&!!e.endpoint_id&&!!t.id&&!e._removing,n=r&&this._effectivePreferred(t)===e.endpoint_id,a="ALWAYS"===(t.id&&t.id in this._userPref?"ALWAYS":t.targeting),d=e.protected?null:this._removalOps(e)[0]??null,l=!!d&&d.id in this._userRemove,p=!!e.endpoint_id||!!d,c=[];if(e._removing&&c.push(D`<span class="d-danger">Will be removed</span>`),e.endpoint_id){const t=this._endpointCurrentRoom().get(e.endpoint_id)??"";t===s||e._removing||c.push(D`<span class="d-change">Moving from ${t?this._roomName(t):"no room"}</span>`);const i=this._deviceName(e.endpoint_id);i!==e.name&&c.push(D`<span class="d-change">Was “${i}”</span>`)}return e.synced||c.push(D`<span class="d-change">New to Alexa</span>`),"ha"===e.source&&!1===e.exposed&&c.push(D`<span>Hidden from Alexa</span>`),"ha_proxy"===e.speaker_note&&c.push(D`<span>Home Assistant only · Alexa can't play here</span>`),"ha"!==e.source&&e.manufacturer&&c.push(D`<span>${e.manufacturer}</span>`),D`
      <div class="row ${o?"open":""} ${e._removing?"removing":""}">
        <button class="rowmain" ?disabled=${!p} aria-expanded=${o} @click=${()=>this._toggleRow(i)}>
          <span class="medal sm">${ye((e=>"media_player"===e.domain&&"TV"===e.category?"tv":e.domain&&$e[e.domain]||e.category&&be[e.category]||(e.is_speaker?"speaker":"device"))(e))}</span>
          <span class="rowtext">
            <span class="name">${e.name}</span>
            ${c.length?D`<span class="detail">${h=c,h.flatMap((e,t)=>t?[D`<span class="sep"> · </span>`,e]:[e])}</span>`:Z}
          </span>
          ${n?a?D`<span class="badge play" title="A plain “play music” in this room plays here">${ye("note")} Plays here</span>`:D`<span class="badge warn" title="Music only plays here when you say the room's name">Only if named</span>`:Z}
          ${p?ye("chevron","chev"):Z}
        </button>
        ${o?D`<div class="rowedit">
              ${e.endpoint_id&&!e._removing?D`<label class="field">
                    <span>Room</span>
                    <select
                      class="roomsel"
                      ?disabled=${this._applying}
                      @change=${t=>this._onHomeMove(e.endpoint_id,t.target.value)}
                    >
                      <option value="" ?selected=${""===s}>No room</option>
                      ${this._homeRooms().map(e=>D`<option value=${e.value} ?selected=${s===e.value}>${e.name}</option>`)}
                    </select>
                  </label>`:Z}
              ${!r||n&&a?Z:D`<button
                    class="chipbtn"
                    ?disabled=${this._applying}
                    title="Make a plain “play music” in ${t.name} play on this speaker"
                    @click=${()=>this._onSetPreferred(t.id,e.endpoint_id)}
                  >
                    ${ye("note")} ${n?"Always play here":"Make main speaker"}
                  </button>`}
              ${d?D`<button
                    class="chipbtn danger ${l?"on":""}"
                    ?disabled=${this._applying}
                    @click=${()=>this._onRemove(e)}
                  >
                    ${ye("trash")} ${l?"Keep it":"Remove"}
                  </button>`:Z}
              ${e.protected?D`<span class="hint">${ye("lock")} Protected — never removed</span>`:Z}
            </div>`:Z}
      </div>
    `;var h}_boardBuckets(e){const t=new Map,i=e=>(e||"").trim().toLowerCase(),o=e=>"home assistant"===(e.manufacturer??"").trim().toLowerCase(),s=new Set(e.filter(e=>!o(e)&&e.endpoint_id).map(e=>i(e.name)));for(const r of e){if(o(r)&&"media_player"===r.domain&&s.has(i(r.name)))continue;let e,n,a,d;if(r.is_speaker)[e,n,a,d]=["spk_alexa","Speakers","speakers",1];else if("ha_proxy"===r.speaker_note)[e,n,a,d]=["spk_hacopy","Home Assistant only","hacopy",1.5];else if("echo"===r.source||"alexa"===r.source)n=r.manufacturer?.trim()||("echo"===r.source?"Echo":"Alexa-only"),a=xe(r)?"echo":"alexa",d=xe(r)?90:91,e="brand:"+n;else{const t=r.domain?ve(r.domain):_e.length-1;[e,n,a,d]=["k"+t,_e[t].label,_e[t].label.toLowerCase().split(" ")[0],t]}const l=t.get(e);l?l.devices.push(r):t.set(e,{label:n,kind:a,order:d,devices:[r]})}return[...t.values()].sort((e,t)=>e.order-t.order)}_statusDisc(e){return"done"===e?D`<span class="state done">${ye("check")}</span>`:"error"===e?D`<span class="state error">${ye("alert")}</span>`:"running"===e?D`<span class="state running"></span>`:D`<span class="state pending"></span>`}};ke.styles=((e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new r(i,e,o)})`
    /* ── Tokens. Everything rides on Home Assistant's theme variables (so light/dark just
       work); colour appears only in the kind icons, section labels, and status medal. ── */
    :host {
      --ao-text: var(--primary-text-color, #1c1c1e);
      --ao-muted: var(--secondary-text-color, #6e6e73);
      --ao-card: var(--card-background-color, #fff);
      --ao-page: var(--primary-background-color, #f2f2f7);
      --ao-line: var(--divider-color, rgba(0, 0, 0, 0.1));
      --ao-accent: var(--primary-color, #03a9f4);
      --ao-ok: var(--success-color, #34a853);
      --ao-warn: var(--warning-color, #f5a524);
      --ao-danger: var(--error-color, #e5484d);
      --ao-radius: 18px;
      display: block;
      min-height: 100%;
      background: var(--ao-page);
      color: var(--ao-text);
      -webkit-font-smoothing: antialiased;
    }
    .wrap {
      max-width: 1320px;
      margin: 0 auto;
      padding: 12px 20px 72px;
      box-sizing: border-box;
    }
    button {
      font: inherit;
      color: inherit;
    }
    .ic {
      width: 20px;
      height: 20px;
      fill: currentColor;
      flex: none;
    }

    /* ── Header ── */
    .top {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 2px 14px;
    }
    .brand {
      width: 38px;
      height: 38px;
      flex: none;
    }
    .titles {
      min-width: 0;
      flex: 1;
    }
    h1 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .sub {
      margin: 1px 0 0;
      color: var(--ao-muted);
      font-size: 0.85rem;
    }
    .iconbtn {
      width: 38px;
      height: 38px;
      flex: none;
      display: inline-grid;
      place-items: center;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: var(--ao-muted);
      cursor: pointer;
    }
    .iconbtn:hover:not(:disabled) {
      background: color-mix(in srgb, var(--ao-text) 8%, transparent);
      color: var(--ao-text);
    }
    .iconbtn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    /* ── Status hero: sticky, so Sync is always one tap away ── */
    .hero {
      position: sticky;
      top: 8px;
      z-index: 4;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
      padding: 16px 18px;
      background: var(--ao-card);
      border: 1px solid var(--ao-line);
      border-radius: var(--ao-radius);
      box-shadow: 0 6px 24px -12px rgba(0, 0, 0, 0.25);
    }
    .herotext {
      flex: 1;
      min-width: 0;
    }
    .herotitle {
      font-size: 1.08rem;
      font-weight: 650;
      letter-spacing: -0.005em;
    }
    .herosub {
      margin-top: 2px;
      color: var(--ao-muted);
      font-size: 0.85rem;
    }
    .progress {
      height: 6px;
      margin-top: 10px;
      border-radius: 99px;
      background: var(--ao-line);
      overflow: hidden;
    }
    .progress span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--ao-accent);
      transition: width 0.4s ease;
    }
    /* The medal: an icon in a soft disc of its own colour. Used by the hero (large) and
       every device row (small, in its kind's colour). */
    .medal {
      --c: var(--kind, var(--ao-muted));
      width: 46px;
      height: 46px;
      flex: none;
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: var(--c);
      background: color-mix(in srgb, var(--c) 15%, transparent);
    }
    .medal .ic {
      width: 26px;
      height: 26px;
    }
    .medal.m-ok {
      --c: var(--ao-ok);
    }
    .medal.m-accent {
      --c: var(--ao-accent);
    }
    .medal.m-warn {
      --c: var(--ao-warn);
    }
    .medalnum {
      font-size: 1.15rem;
      font-weight: 700;
    }
    .medal.sm {
      width: 34px;
      height: 34px;
    }
    .medal.sm .ic {
      width: 19px;
      height: 19px;
    }
    .hero.celebrate .medal {
      animation: pop 0.6s cubic-bezier(0.2, 1.4, 0.4, 1);
    }
    .hero.celebrate .herotitle {
      color: var(--ao-ok);
    }
    @keyframes pop {
      0% {
        transform: scale(0.55);
      }
      100% {
        transform: scale(1);
      }
    }
    .spin {
      animation: spin 1.1s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ── Buttons ── */
    .primary {
      flex: none;
      border: none;
      border-radius: 99px;
      padding: 10px 20px;
      font-size: 0.92rem;
      font-weight: 650;
      background: var(--ao-accent);
      color: var(--text-primary-color, #fff);
      cursor: pointer;
      box-shadow: 0 4px 14px -6px color-mix(in srgb, var(--ao-accent) 80%, transparent);
    }
    .primary:hover:not(:disabled) {
      filter: brightness(1.06);
    }
    .primary:disabled {
      opacity: 0.45;
      cursor: default;
      box-shadow: none;
    }
    .primary.wide {
      width: 100%;
      padding: 13px 20px;
      font-size: 1rem;
    }
    .chipbtn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--ao-line);
      border-radius: 99px;
      padding: 6px 13px 6px 10px;
      background: var(--ao-card);
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
    }
    .chipbtn .ic {
      width: 17px;
      height: 17px;
    }
    .chipbtn:hover:not(:disabled) {
      border-color: var(--ao-accent);
      color: var(--ao-accent);
    }
    .chipbtn.danger:hover:not(:disabled) {
      border-color: var(--ao-danger);
      color: var(--ao-danger);
    }
    .chipbtn.danger.on {
      background: var(--ao-danger);
      border-color: var(--ao-danger);
      color: #fff;
    }
    button:focus-visible,
    select:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--ao-accent);
      outline-offset: 2px;
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: -4px 0 18px;
      padding: 12px 16px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--ao-warn) 13%, transparent);
      color: var(--ao-text);
      font-size: 0.88rem;
      line-height: 1.45;
    }
    .notice .ic {
      color: var(--ao-warn);
    }

    /* ── Rooms: cards packed into columns (masonry) ── */
    .rooms {
      columns: 360px;
      column-gap: 16px;
    }
    .room {
      display: flow-root;
      break-inside: avoid;
      margin: 0 0 16px;
      padding: 16px 12px 8px;
      background: var(--ao-card);
      border: 1px solid var(--ao-line);
      border-radius: var(--ao-radius);
    }
    .room.unroomed {
      background: transparent;
      border-style: dashed;
    }
    .roomhead {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 4px 10px;
      padding: 0 6px 4px;
    }
    .roomhead h2 {
      margin: 0;
      font-size: 1.12rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .rcount {
      color: var(--ao-muted);
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    .rtag {
      margin-left: auto;
      color: var(--ao-muted);
      font-size: 0.75rem;
      font-weight: 600;
    }
    .rtag.new {
      color: var(--ao-accent);
    }
    .empty {
      margin: 6px 6px 10px;
      color: var(--ao-muted);
      font-size: 0.85rem;
    }

    /* Kind sections: a coloured label + hairline. No tinted boxes, no rails. */
    .group {
      --kind: var(--ao-muted);
    }
    .group h3 {
      margin: 12px 6px 2px;
      padding-bottom: 5px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: var(--kind);
      border-bottom: 1px solid color-mix(in srgb, var(--kind) 30%, transparent);
    }
    .kind-lighting { --kind: #d08700; }
    .kind-speakers { --kind: #2f6fed; }
    .kind-media    { --kind: #d0457d; }
    .kind-climate  { --kind: #0f9d9d; }
    .kind-scenes   { --kind: #7c4dde; }
    .kind-other    { --kind: #6b7280; }
    .kind-echo     { --kind: #b06f2e; }
    .kind-alexa    { --kind: #9333ea; }
    .kind-hacopy   { --kind: #8e949c; }
    .group.kind-hacopy {
      opacity: 0.7;
    }

    /* ── Device rows: calm by default; tap to edit ── */
    .row {
      border-radius: 14px;
    }
    .row.open {
      background: color-mix(in srgb, var(--ao-text) 4%, transparent);
    }
    .rowmain {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px 6px;
      border: none;
      border-radius: 14px;
      background: transparent;
      text-align: left;
      cursor: pointer;
    }
    .rowmain:disabled {
      cursor: default;
    }
    .rowmain:hover:not(:disabled) {
      background: color-mix(in srgb, var(--ao-text) 4%, transparent);
    }
    .rowtext {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .name {
      font-size: 0.95rem;
      font-weight: 550;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .detail {
      margin-top: 1px;
      color: var(--ao-muted);
      font-size: 0.8rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .d-change {
      color: var(--ao-accent);
      font-weight: 600;
    }
    .d-danger {
      color: var(--ao-danger);
      font-weight: 600;
    }
    .row.removing .name {
      text-decoration: line-through;
      color: var(--ao-muted);
    }
    .row.removing .medal {
      filter: grayscale(1);
      opacity: 0.6;
    }
    .chev {
      width: 20px;
      height: 20px;
      color: var(--ao-muted);
      opacity: 0.55;
      transition: transform 0.2s ease;
    }
    .open > .rowmain .chev,
    .rgroup.open .rgtitle .chev {
      transform: rotate(180deg);
    }
    /* With a mouse, rows stay calm: the disclosure chevron appears on hover (and stays on the
       open row). Touch screens keep it visible so rows still read as tappable. */
    @media (hover: hover) {
      .rowmain .chev {
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.2s ease;
      }
      .rowmain:hover .chev,
      .rowmain:focus-visible .chev,
      .row.open .rowmain .chev {
        opacity: 0.55;
      }
    }
    .badge {
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 3px 9px 3px 7px;
      border-radius: 99px;
      font-size: 0.74rem;
      font-weight: 650;
      white-space: nowrap;
    }
    .badge .ic {
      width: 14px;
      height: 14px;
    }
    .badge.play {
      color: #2f6fed;
      background: color-mix(in srgb, #2f6fed 13%, transparent);
    }
    .badge.warn {
      padding-left: 9px;
      color: var(--ao-warn);
      background: color-mix(in srgb, var(--ao-warn) 15%, transparent);
    }
    .rowedit {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 10px;
      padding: 2px 10px 12px 52px;
    }
    .field {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.84rem;
      color: var(--ao-muted);
      font-weight: 600;
    }
    .roomsel {
      max-width: 220px;
      padding: 6px 10px;
      border: 1px solid var(--ao-line);
      border-radius: 10px;
      background: var(--ao-card);
      color: var(--ao-text);
      font: inherit;
      font-size: 0.88rem;
    }
    .hint {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--ao-muted);
      font-size: 0.8rem;
    }
    .hint .ic {
      width: 16px;
      height: 16px;
    }

    /* ── Review sheet ── */
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 10;
      background: rgba(0, 0, 0, 0.42);
      animation: fade 0.18s ease;
    }
    .sheet {
      position: fixed;
      z-index: 11;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(640px, calc(100vw - 32px));
      max-height: min(82vh, 780px);
      display: flex;
      flex-direction: column;
      background: var(--ao-card);
      border-radius: 22px;
      box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.45);
      animation: rise 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
    }
    .sheethead {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px 20px 12px 24px;
      border-bottom: 1px solid var(--ao-line);
    }
    .sheethead > div {
      flex: 1;
    }
    .sheethead h2 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
    }
    .sheetbody {
      overflow-y: auto;
      padding: 6px 12px;
    }
    .sheetfoot {
      padding: 14px 20px 20px;
      border-top: 1px solid var(--ao-line);
    }
    .rgroup {
      border-bottom: 1px solid var(--ao-line);
    }
    .rgroup:last-child {
      border-bottom: none;
    }
    .rghead {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 4px 6px 12px;
    }
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      flex: none;
      margin: 0;
      accent-color: var(--ao-accent);
    }
    .rgtitle {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 6px;
      border: none;
      border-radius: 10px;
      background: none;
      text-align: left;
      cursor: pointer;
    }
    .rgtitle:hover {
      background: color-mix(in srgb, var(--ao-text) 4%, transparent);
    }
    .rgicon {
      display: inline-grid;
      color: var(--ao-accent);
    }
    .rgroup.danger .rgicon,
    .rgroup.danger .rgname {
      color: var(--ao-danger);
    }
    .rgname {
      flex: 1;
      font-weight: 650;
    }
    .rgcount {
      color: var(--ao-muted);
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
    }
    .rgbody {
      padding: 0 8px 10px 40px;
    }
    .rop {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 4px;
      cursor: pointer;
    }
    .roptext {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .roptitle {
      font-size: 0.9rem;
    }
    .ropdetail {
      color: var(--ao-muted);
      font-size: 0.8rem;
    }
    .state {
      width: 18px;
      height: 18px;
      flex: none;
      display: inline-grid;
      place-items: center;
      border-radius: 50%;
      box-sizing: border-box;
    }
    .state .ic {
      width: 18px;
      height: 18px;
    }
    .state.pending::after {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--ao-line);
    }
    .state.running {
      border: 2px solid var(--ao-line);
      border-top-color: var(--ao-accent);
      animation: spin 0.7s linear infinite;
    }
    .state.done {
      color: var(--ao-ok);
    }
    .state.error {
      color: var(--ao-danger);
    }
    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translate(-50%, -46%);
      }
    }

    /* ── Loading skeleton ── */
    .skel {
      border-radius: 8px;
      background: linear-gradient(90deg, var(--ao-line) 25%, color-mix(in srgb, var(--ao-line) 45%, transparent) 50%, var(--ao-line) 75%);
      background-size: 300% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    .skel-medal {
      width: 46px;
      height: 46px;
      border-radius: 50%;
    }
    .skel-title {
      width: 40%;
      height: 16px;
      margin: 4px 6px 12px;
    }
    .herotext .skel-title {
      width: 50%;
      margin: 0 0 8px;
    }
    .skel-line {
      flex: 1;
      height: 12px;
    }
    .skel-line.short {
      width: 30%;
      flex: none;
    }
    .skel-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 6px;
    }
    .skel-dot {
      width: 34px;
      height: 34px;
      border-radius: 50%;
    }
    @keyframes shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: 0 0;
      }
    }

    /* ── Phones ── */
    @media (max-width: 600px) {
      .wrap {
        padding: 6px 10px 64px;
      }
      .hero {
        flex-wrap: wrap;
        padding: 14px;
      }
      .hero .primary {
        width: 100%;
      }
      .sheet {
        left: 0;
        right: 0;
        top: auto;
        bottom: 0;
        width: 100%;
        transform: none;
        max-height: 88vh;
        border-radius: 22px 22px 0 0;
        animation: slideup 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
      }
      .rowedit {
        padding-left: 10px;
      }
    }
    @keyframes slideup {
      from {
        transform: translateY(100%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  `,e([pe({attribute:!1})],ke.prototype,"hass",void 0),e([pe({attribute:!1})],ke.prototype,"narrow",void 0),e([ce()],ke.prototype,"_plan",void 0),e([ce()],ke.prototype,"_planBusy",void 0),e([ce()],ke.prototype,"_accepted",void 0),e([ce()],ke.prototype,"_reviewOpen",void 0),e([ce()],ke.prototype,"_opStatus",void 0),e([ce()],ke.prototype,"_applying",void 0),e([ce()],ke.prototype,"_userMove",void 0),e([ce()],ke.prototype,"_userPref",void 0),e([ce()],ke.prototype,"_userRemove",void 0),e([ce()],ke.prototype,"_expandedGroups",void 0),e([ce()],ke.prototype,"_openRow",void 0),e([ce()],ke.prototype,"_applyTotal",void 0),e([ce()],ke.prototype,"_lastErrors",void 0),e([ce()],ke.prototype,"_justSynced",void 0),ke=e([(e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)})("alexa-panel")],ke);export{ke as AlexaPanel};
