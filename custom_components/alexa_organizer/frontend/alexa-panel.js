function e(e,t,s,i){var o,a=arguments.length,n=a<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,s,i);else for(var r=e.length-1;r>=0;r--)(o=e[r])&&(n=(a<3?o(n):a>3?o(t,s,n):o(t,s))||n);return a>3&&n&&Object.defineProperty(t,s,n),n}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,s=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),o=new WeakMap;let a=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(s&&void 0===e){const s=void 0!==t&&1===t.length;s&&(e=o.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&o.set(t,e))}return e}toString(){return this.cssText}};const n=s?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const s of e.cssRules)t+=s.cssText;return(e=>new a("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:r,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,m=u.trustedTypes,g=m?m.emptyScript:"",_=u.reactiveElementPolyfillSupport,v=(e,t)=>e,f={toAttribute(e,t){switch(t){case Boolean:e=e?g:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let s=e;switch(t){case Boolean:s=null!==e;break;case Number:s=null===e?null:Number(e);break;case Object:case Array:try{s=JSON.parse(e)}catch(e){s=null}}return s}},y=(e,t)=>!r(e,t),x={attribute:!0,type:String,converter:f,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(e,s,t);void 0!==i&&l(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){const{get:i,set:o}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:i,set(t){const a=i?.call(this);o?.call(this,t),this.requestUpdate(e,a,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const e=this.properties,t=[...c(e),...h(e)];for(const s of t)this.createProperty(s,e[s])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,s]of t)this.elementProperties.set(e,s)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const s=this._$Eu(e,t);void 0!==s&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const e of s)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const s=t.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,i)=>{if(s)e.adoptedStyleSheets=i.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const s of i){const i=document.createElement("style"),o=t.litNonce;void 0!==o&&i.setAttribute("nonce",o),i.textContent=s.cssText,e.appendChild(i)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){const s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(void 0!==i&&!0===s.reflect){const o=(void 0!==s.converter?.toAttribute?s.converter:f).toAttribute(t,s.type);this._$Em=e,null==o?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(e,t){const s=this.constructor,i=s._$Eh.get(e);if(void 0!==i&&this._$Em!==i){const e=s.getPropertyOptions(i),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:f;this._$Em=i;const a=o.fromAttribute(t,e.type);this[i]=a??this._$Ej?.get(i)??a,this._$Em=null}}requestUpdate(e,t,s,i=!1,o){if(void 0!==e){const a=this.constructor;if(!1===i&&(o=this[e]),s??=a.getPropertyOptions(e),!((s.hasChanged??y)(o,t)||s.useDefault&&s.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,s))))return;this.C(e,t,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:o},a){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==o||void 0!==a)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),!0===i&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,s]of e){const{wrapped:e}=s,i=this[t];!0!==e||this._$AL.has(t)||void 0===i||this.C(t,void 0,s,i)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[v("elementProperties")]=new Map,$[v("finalized")]=new Map,_?.({ReactiveElement:$}),(u.reactiveElementVersions??=[]).push("2.1.2");const b=globalThis,w=e=>e,A=b.trustedTypes,S=A?A.createPolicy("lit-html",{createHTML:e=>e}):void 0,k="$lit$",R=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+R,P=`<${E}>`,C=document,B=()=>C.createComment(""),z=e=>null===e||"object"!=typeof e&&"function"!=typeof e,O=Array.isArray,M="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,N=/>/g,T=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,D=/"/g,L=/^(?:script|style|textarea|title)$/i,j=(e=>(t,...s)=>({_$litType$:e,strings:t,values:s}))(1),K=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),q=new WeakMap,V=C.createTreeWalker(C,129);function G(e,t){if(!O(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(t):t}const J=(e,t)=>{const s=e.length-1,i=[];let o,a=2===t?"<svg>":3===t?"<math>":"",n=U;for(let t=0;t<s;t++){const s=e[t];let r,l,d=-1,c=0;for(;c<s.length&&(n.lastIndex=c,l=n.exec(s),null!==l);)c=n.lastIndex,n===U?"!--"===l[1]?n=H:void 0!==l[1]?n=N:void 0!==l[2]?(L.test(l[2])&&(o=RegExp("</"+l[2],"g")),n=T):void 0!==l[3]&&(n=T):n===T?">"===l[0]?(n=o??U,d=-1):void 0===l[1]?d=-2:(d=n.lastIndex-l[2].length,r=l[1],n=void 0===l[3]?T:'"'===l[3]?D:I):n===D||n===I?n=T:n===H||n===N?n=U:(n=T,o=void 0);const h=n===T&&e[t+1].startsWith("/>")?" ":"";a+=n===U?s+P:d>=0?(i.push(r),s.slice(0,d)+k+s.slice(d)+R+h):s+R+(-2===d?t:h)}return[G(e,a+(e[s]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),i]};class F{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let o=0,a=0;const n=e.length-1,r=this.parts,[l,d]=J(e,t);if(this.el=F.createElement(l,s),V.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(i=V.nextNode())&&r.length<n;){if(1===i.nodeType){if(i.hasAttributes())for(const e of i.getAttributeNames())if(e.endsWith(k)){const t=d[a++],s=i.getAttribute(e).split(R),n=/([.?@])?(.*)/.exec(t);r.push({type:1,index:o,name:n[2],strings:s,ctor:"."===n[1]?ee:"?"===n[1]?te:"@"===n[1]?se:Q}),i.removeAttribute(e)}else e.startsWith(R)&&(r.push({type:6,index:o}),i.removeAttribute(e));if(L.test(i.tagName)){const e=i.textContent.split(R),t=e.length-1;if(t>0){i.textContent=A?A.emptyScript:"";for(let s=0;s<t;s++)i.append(e[s],B()),V.nextNode(),r.push({type:2,index:++o});i.append(e[t],B())}}}else if(8===i.nodeType)if(i.data===E)r.push({type:2,index:o});else{let e=-1;for(;-1!==(e=i.data.indexOf(R,e+1));)r.push({type:7,index:o}),e+=R.length-1}o++}}static createElement(e,t){const s=C.createElement("template");return s.innerHTML=e,s}}function Z(e,t,s=e,i){if(t===K)return t;let o=void 0!==i?s._$Co?.[i]:s._$Cl;const a=z(t)?void 0:t._$litDirective$;return o?.constructor!==a&&(o?._$AO?.(!1),void 0===a?o=void 0:(o=new a(e),o._$AT(e,s,i)),void 0!==i?(s._$Co??=[])[i]=o:s._$Cl=o),void 0!==o&&(t=Z(e,o._$AS(e,t.values),o,i)),t}class X{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??C).importNode(t,!0);V.currentNode=i;let o=V.nextNode(),a=0,n=0,r=s[0];for(;void 0!==r;){if(a===r.index){let t;2===r.type?t=new Y(o,o.nextSibling,this,e):1===r.type?t=new r.ctor(o,r.name,r.strings,this,e):6===r.type&&(t=new ie(o,this,e)),this._$AV.push(t),r=s[++n]}a!==r?.index&&(o=V.nextNode(),a++)}return V.currentNode=C,i}p(e){let t=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}}class Y{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),z(e)?e===W||null==e||""===e?(this._$AH!==W&&this._$AR(),this._$AH=W):e!==this._$AH&&e!==K&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>O(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==W&&z(this._$AH)?this._$AA.nextSibling.data=e:this.T(C.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:s}=e,i="number"==typeof s?this._$AC(e):(void 0===s.el&&(s.el=F.createElement(G(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{const e=new X(i,this),s=e.u(this.options);e.p(t),this.T(s),this._$AH=e}}_$AC(e){let t=q.get(e.strings);return void 0===t&&q.set(e.strings,t=new F(e)),t}k(e){O(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let s,i=0;for(const o of e)i===t.length?t.push(s=new Y(this.O(B()),this.O(B()),this,this.options)):s=t[i],s._$AI(o),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Q{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,o){this.type=1,this._$AH=W,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=W}_$AI(e,t=this,s,i){const o=this.strings;let a=!1;if(void 0===o)e=Z(this,e,t,0),a=!z(e)||e!==this._$AH&&e!==K,a&&(this._$AH=e);else{const i=e;let n,r;for(e=o[0],n=0;n<o.length-1;n++)r=Z(this,i[s+n],t,n),r===K&&(r=this._$AH[n]),a||=!z(r)||r!==this._$AH[n],r===W?e=W:e!==W&&(e+=(r??"")+o[n+1]),this._$AH[n]=r}a&&!i&&this.j(e)}j(e){e===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends Q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===W?void 0:e}}class te extends Q{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==W)}}class se extends Q{constructor(e,t,s,i,o){super(e,t,s,i,o),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??W)===K)return;const s=this._$AH,i=e===W&&s!==W||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,o=e!==W&&(s===W||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ie{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}}const oe=b.litHtmlPolyfillSupport;oe?.(F,Y),(b.litHtmlVersions??=[]).push("3.3.3");const ae=globalThis;class ne extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,s)=>{const i=s?.renderBefore??t;let o=i._$litPart$;if(void 0===o){const e=s?.renderBefore??null;i._$litPart$=o=new Y(t.insertBefore(B(),e),e,void 0,s??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return K}}ne._$litElement$=!0,ne.finalized=!0,ae.litElementHydrateSupport?.({LitElement:ne});const re=ae.litElementPolyfillSupport;re?.({LitElement:ne}),(ae.litElementVersions??=[]).push("4.2.2");const le={attribute:!0,type:String,converter:f,reflect:!1,hasChanged:y},de=(e=le,t,s)=>{const{kind:i,metadata:o}=s;let a=globalThis.litPropertyMetadata.get(o);if(void 0===a&&globalThis.litPropertyMetadata.set(o,a=new Map),"setter"===i&&((e=Object.create(e)).wrapped=!0),a.set(s.name,e),"accessor"===i){const{name:i}=s;return{set(s){const o=t.get.call(this);t.set.call(this,s),this.requestUpdate(i,o,e,!0,s)},init(t){return void 0!==t&&this.C(i,void 0,e,t),t}}}if("setter"===i){const{name:i}=s;return function(s){const o=this[i];t.call(this,s),this.requestUpdate(i,o,e,!0,s)}}throw Error("Unsupported decorator location: "+i)};function ce(e){return(t,s)=>"object"==typeof s?de(e,t,s):((e,t,s)=>{const i=t.hasOwnProperty(s);return t.constructor.createProperty(s,e),i?Object.getOwnPropertyDescriptor(t,s):void 0})(e,t,s)}function he(e){return ce({...e,state:!0,attribute:!1})}const pe={media_player:"Speaker",light:"Light",switch:"Switch",climate:"Climate",scene:"Scene",script:"Script",cover:"Cover",fan:"Fan",vacuum:"Vacuum",lock:"Lock",camera:"Camera",input_boolean:"Toggle"},ue=[{label:"Lighting",domains:["light","switch"]},{label:"Speakers",domains:["media_player"]},{label:"Climate",domains:["climate","fan"]},{label:"Scenes & routines",domains:["scene","script"]},{label:"Other",domains:["cover","vacuum","lock","camera","input_boolean"]}],me={};ue.forEach((e,t)=>e.domains.forEach(e=>me[e]=t));const ge=e=>me[e]??ue.length-1;let _e=class extends ne{constructor(){super(...arguments),this.narrow=!1,this._rows=[],this._summary={expose:0,live_remove:0,ghost_remove:0},this._loading=!0,this._busy=!1,this._held=!1,this._unavailable=null,this._alexa=null,this._alexaBusy=!1,this._alexaRemove=new Set,this._detailsOpen=!1,this._roomPlan=null,this._roomBusy=!1,this._roomInclude=new Set,this._roomStatus={},this._deviceRooms=null,this._deviceRoomsBusy=!1,this._moves={},this._moveStatus={},this._assignPlan=null,this._assignBusy=!1,this._assignInclude=new Set,this._assignStatus={},this._onResize=()=>this._positionBar()}connectedCallback(){super.connectedCallback(),this._load(),window.addEventListener("resize",this._onResize),this._ro=new ResizeObserver(()=>this._positionBar()),this._ro.observe(this)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("resize",this._onResize),this._ro?.disconnect()}updated(){this._positionBar()}_positionBar(){const e=this.getBoundingClientRect();e.width&&(this.style.setProperty("--ac-bar-left",`${Math.round(e.left+e.width/2)}px`),this.style.setProperty("--ac-bar-width",`${Math.max(300,Math.round(.6*e.width))}px`))}async _load(){this._loading=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/inventory"});this._ingest(e)}finally{this._loading=!1}}_ingest(e){this._rows=e.rows,this._summary=e.summary,this._unavailable=e.unavailable??null}async _toggle(e){if(!e.ghost&&!this._busy){this._busy=!0;try{const t=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/set",entity_id:e.entity_id,expose:!e.desired});this._ingest(t)}finally{this._busy=!1}}}async _apply(e){if(!this._busy){this._busy=!0;try{const t=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/apply",force:e});this._held=t.held,this._ingest(t.inventory)}finally{this._busy=!1}}}async _previewAlexa(){if(!this._alexaBusy){this._alexaBusy=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/alexa_devices"});this._alexa=e,this._alexaRemove=new Set((e.devices??[]).filter(e=>e.suggested_remove&&!e.protected).map(e=>e.id))}finally{this._alexaBusy=!1}}}_toggleDevice(e){if(e.protected)return;const t=new Set(this._alexaRemove);t.has(e.id)?t.delete(e.id):t.add(e.id),this._alexaRemove=t}async _applyAlexaSelected(){if(!this._alexaBusy&&0!==this._alexaRemove.size){this._alexaBusy=!0;try{await this.hass.callService("alexa_organizer","alexa_devices",{apply:!0,endpoint_ids:[...this._alexaRemove]});const e=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/alexa_devices"});this._alexa=e;const t=new Set((e.devices??[]).map(e=>e.id));this._alexaRemove=new Set([...this._alexaRemove].filter(e=>t.has(e)))}finally{this._alexaBusy=!1}}}get _nothingToDo(){const e=this._summary;return e.expose+e.live_remove+e.ghost_remove===0}_rooms(){const e=new Map;for(const t of this._rows){if(t.ghost)continue;const s=t.area??"",i=e.get(s);i?i.push(t):e.set(s,[t])}const t=[...e.keys()].sort((e,t)=>""===e?1:""===t?-1:e.localeCompare(t));return t.map(t=>{const s=ue.map(()=>[]);for(const i of e.get(t))s[ge(i.domain)].push(i);const i=ue.map((e,t)=>({label:e.label,rows:s[t].slice().sort((e,t)=>e.name.localeCompare(t.name))})).filter(e=>e.rows.length>0);return{area:""===t?"No room":t,groups:i}})}get _ghosts(){return this._rows.filter(e=>e.ghost)}render(){if(this._loading)return j`<div class="wrap"><p class="muted">Loading exposure…</p></div>`;const e=this._summary;return j`
      <div class="wrap">
        <header>
          <div class="titles">
            <h1>Alexa Organizer</h1>
            <p class="sub">
              Grouped by your Home Assistant areas. Controls what Alexa sees — organize the
              actual rooms &amp; groups in the Alexa app.
            </p>
          </div>
          <span class="chip ok headernote" ?hidden=${this._hasPending}>In sync</span>
        </header>

        ${this._unavailable?j`<div class="banner err">
              Can't read Alexa exposure (${this._unavailable}). Nothing was changed.
            </div>`:W}

        ${this._held?j`<div class="banner warn">
              Held ${e.live_remove} live removal(s) for safety — additions and stale cleanup
              were applied. Review the list, then
              <button class="link" @click=${()=>this._apply(!0)}>force apply</button>.
            </div>`:W}

        ${this._rooms().map(e=>j`
            <section class="room">
              <h2>
                ${e.area}
                <span class="count">${e.groups.reduce((e,t)=>e+t.rows.length,0)}</span>
              </h2>
              ${e.groups.map(e=>j`
                  <div class="kindgroup">
                    <h3>${e.label}</h3>
                    <div class="rows">${e.rows.map(e=>this._row(e))}</div>
                  </div>
                `)}
            </section>
          `)}
        ${this._ghosts.length?this._ghostSection():W}
        <div class="exp-divider">
          <h2 class="exp-heading">Alexa cleanup &amp; sync <span class="exp">experimental</span></h2>
          <p class="muted">
            Reach into Alexa's own rooms and device list to match Home Assistant — rename and
            clean up rooms, snap devices into them, and clear stale registrations. Needs Alexa
            Media Player or the core Alexa Devices integration logged in.
          </p>
        </div>
        ${this._roomSection()}
        ${this._assignSection()}
        ${this._deviceRoomsSection()}
        ${this._alexaSection()}
      </div>
      ${this._hasPending?this._deltaBar():W}
    `}get _hasExposure(){return!this._nothingToDo}get _hasPending(){return this._hasExposure||this._alexaRemove.size>0||this._roomInclude.size>0||this._moveCount>0||this._assignInclude.size>0}async _applyAll(){this._busy||this._alexaBusy||this._roomBusy||this._deviceRoomsBusy||this._assignBusy||(this._hasExposure&&await this._apply(!1),this._alexaRemove.size>0&&await this._applyAlexaSelected(),this._roomInclude.size>0&&await this._applyRoomOps(),this._assignInclude.size>0&&await this._applyAssigns(),this._moveCount>0&&await this._applyMoves())}async _loadRoomPlan(){if(!this._roomBusy){this._roomBusy=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/room_plan"});this._roomPlan=e;const t=e.ops??[];this._roomInclude=new Set(t.filter(e=>e.suggested).map(e=>this._opKey(e))),this._roomStatus={}}finally{this._roomBusy=!1}}}_opKey(e){return`${e.op}|${e.id??e.name}`}_toggleRoomOp(e){const t=this._opKey(e),s=new Set(this._roomInclude);s.has(t)?s.delete(t):s.add(t),this._roomInclude=s}async _applyRoomOps(){const e={rename:0,delete:1,create:2},t=(this._roomPlan?.ops??[]).filter(e=>this._roomInclude.has(this._opKey(e))).sort((t,s)=>e[t.op]-e[s.op]);for(const e of t){const t=this._opKey(e);this._roomStatus={...this._roomStatus,[t]:"running"};const s={action:e.op};e.id&&(s.id=e.id),"rename"===e.op&&(s.name=e.to),"create"===e.op&&(s.name=e.name);try{await this.hass.callService("alexa_organizer","room_op",s),this._roomStatus={...this._roomStatus,[t]:"done"}}catch{this._roomStatus={...this._roomStatus,[t]:"error"}}}await this._loadRoomPlan()}_statusDisc(e){return"done"===e?j`<span class="state done">✓</span>`:"error"===e?j`<span class="state error">✗</span>`:"running"===e?j`<span class="state running"></span>`:j`<span class="state pending"></span>`}_roomSection(){const e=this._roomPlan;return j`
      <section class="alexa-exp">
        <h2>Alexa rooms <span class="exp">experimental</span></h2>
        <p class="muted">
          Mirror your Home Assistant areas into Alexa's rooms — rename to match, clear the ghost
          rooms, and (opt-in) create the missing ones. Toggle each op On/Off; Apply runs them
          from the bar below.
        </p>
        ${e?!1===e.available?j`<div class="banner warn">
                Unavailable: ${e.reason??"no session"}. Needs Alexa Media Player logged in.
              </div>`:this._roomPlanBody(e.ops??[]):j`<button class="apply" ?disabled=${this._roomBusy} @click=${this._loadRoomPlan}>
              ${this._roomBusy?"Loading…":"Preview room sync"}
            </button>`}
      </section>
    `}_roomPlanBody(e){if(!e.length)return j`<p class="muted">Your Alexa rooms already match your HA areas. Nothing to do.</p>`;const t=(e,t)=>t.length?j`<div class="kindgroup">
            <h3>${e} <span class="count">${t.length}</span></h3>
            <div class="rows">${t.map(e=>this._opRow(e))}</div>
          </div>`:W;return j`
      ${t("Rename to match HA",e.filter(e=>"rename"===e.op))}
      ${t("Ghost rooms",e.filter(e=>"delete"===e.op))}
      ${t("Missing rooms (opt-in)",e.filter(e=>"create"===e.op))}
    `}_opRow(e){const t=this._opKey(e),s=this._roomInclude.has(t),i=this._busy||this._alexaBusy||this._roomBusy;return j`
      <div class="row ${"delete"===e.op&&s?"removing":""}">
        ${this._statusDisc(this._roomStatus[t])}
        <div class="info">
          <div class="name">${"rename"===e.op?j`${e.from} → ${e.to}`:e.name}</div>
          <div class="meta">
            <span class="kind">${e.op}</span>
            ${"delete"===e.op?e.empty?"empty — no HA area":"has devices":W}
          </div>
        </div>
        <button
          class="toggle ${s?"on":"off"}"
          ?disabled=${i}
          @click=${()=>this._toggleRoomOp(e)}
          title=${s?"Will apply — click to skip":"Skipped — click to include"}
        >
          ${s?"On":"Off"}
        </button>
      </div>
    `}async _loadAssignPlan(){if(!this._assignBusy){this._assignBusy=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/assign_plan"});this._assignPlan=e,this._assignInclude=new Set((e.assigns??[]).map(e=>e.id)),this._assignStatus={}}finally{this._assignBusy=!1}}}_toggleAssign(e){const t=new Set(this._assignInclude);t.has(e)?t.delete(e):t.add(e),this._assignInclude=t}async _applyAssigns(){const e=(this._assignPlan?.assigns??[]).filter(e=>this._assignInclude.has(e.id));for(const t of e){this._assignStatus={...this._assignStatus,[t.id]:"running"};const e={endpoint_id:t.id,to:t.to_id};t.from_id&&(e.from=t.from_id);try{await this.hass.callService("alexa_organizer","move_device",e),this._assignStatus={...this._assignStatus,[t.id]:"done"}}catch{this._assignStatus={...this._assignStatus,[t.id]:"error"}}}await this._loadAssignPlan()}_assignSection(){const e=this._assignPlan;return j`
      <section class="alexa-exp">
        <h2>Snap exposed devices to rooms <span class="exp">experimental</span></h2>
        <p class="muted">
          Put each exposed HA device into its area's Alexa room (HA area is the truth, matched by
          name). Suggestions are pre-checked — toggle any off; applies from the bar below.
        </p>
        ${e?!1===e.available?j`<div class="banner warn">
                Unavailable: ${e.reason??"no session"}. Needs Alexa Media Player or Alexa Devices.
              </div>`:this._assignBody(e):j`<button class="apply" ?disabled=${this._assignBusy} @click=${this._loadAssignPlan}>
              ${this._assignBusy?"Loading…":"Preview assignments"}
            </button>`}
      </section>
    `}_assignBody(e){const t=e.assigns??[];return t.length?j`
      <div class="kindgroup">
        <h3>Assign to room <span class="count">${t.length}</span></h3>
        <div class="rows">
          ${t.map(e=>{const t=this._assignInclude.has(e.id),s=this._busy||this._alexaBusy||this._roomBusy||this._assignBusy;return j`<div class="row ${t?"moving":""}">
              ${this._statusDisc(this._assignStatus[e.id])}
              <div class="info">
                <div class="name">${e.name}</div>
                <div class="meta">→ ${e.to_name}</div>
              </div>
              <button class="toggle ${t?"on":"off"}" ?disabled=${s}
                @click=${()=>this._toggleAssign(e.id)}>${t?"On":"Off"}</button>
            </div>`})}
        </div>
      </div>
      <p class="muted">
        ${e.no_room?`${e.no_room} more need their room created first (room sync). `:""}
        ${e.unmatched?`${e.unmatched} endpoints didn't match a live HA entity (left alone).`:""}
      </p>
    `:j`<p class="muted">
        Nothing to assign${e.no_room?` (${e.no_room} need a room created first — run room sync)`:""}.
      </p>`}async _loadDeviceRooms(){if(!this._deviceRoomsBusy){this._deviceRoomsBusy=!0;try{this._deviceRooms=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/device_rooms"});const e={};for(const t of this._deviceRooms.devices??[])t.suggested_room_id&&(e[t.id]=t.suggested_room_id);this._moves=e,this._moveStatus={}}finally{this._deviceRoomsBusy=!1}}}_currentRoom(e){return e.room_id??""}_onRoomChange(e,t){const s={...this._moves};t===this._currentRoom(e)?delete s[e.id]:s[e.id]=t,this._moves=s}get _moveCount(){return Object.keys(this._moves).length}async _applyMoves(){const e=new Map((this._deviceRooms?.devices??[]).map(e=>[e.id,e]));for(const[t,s]of Object.entries(this._moves)){const i=e.get(t);if(!i)continue;this._moveStatus={...this._moveStatus,[t]:"running"};const o={endpoint_id:t};i.room_id&&(o.from=i.room_id),s&&(o.to=s);try{await this.hass.callService("alexa_organizer","move_device",o),this._moveStatus={...this._moveStatus,[t]:"done"}}catch{this._moveStatus={...this._moveStatus,[t]:"error"}}}await this._loadDeviceRooms()}_deviceRoomsSection(){const e=this._deviceRooms;return j`
      <section class="alexa-exp">
        <h2>Devices in rooms <span class="exp">experimental</span></h2>
        <p class="muted">
          Which Alexa room each device sits in. Devices whose name matches a room are
          pre-snapped to it (highlighted) — override any with the dropdown; moves apply from
          the bar below.
        </p>
        ${e?!1===e.available?j`<div class="banner warn">
                Unavailable: ${e.reason??"no session"}. Needs Alexa Media Player logged in.
              </div>`:this._deviceRoomsBody(e):j`<button class="apply" ?disabled=${this._deviceRoomsBusy} @click=${this._loadDeviceRooms}>
              ${this._deviceRoomsBusy?"Loading…":"Load device rooms"}
            </button>`}
      </section>
    `}_deviceRoomsBody(e){const t=e.rooms??[],s=new Map;for(const t of e.devices??[]){const e=t.room_name??"Unassigned",i=s.get(e);i?i.push(t):s.set(e,[t])}const i=[...s.keys()].sort((e,t)=>"Unassigned"===e?1:"Unassigned"===t?-1:e.localeCompare(t));return j`
      ${i.map(e=>j`
          <div class="kindgroup">
            <h3>${e} <span class="count">${s.get(e).length}</span></h3>
            <div class="rows">${s.get(e).map(e=>this._deviceRoomRow(e,t))}</div>
          </div>
        `)}
    `}_deviceRoomRow(e,t){const s=e.id in this._moves,i=s?this._moves[e.id]:this._currentRoom(e),o=this._busy||this._alexaBusy||this._roomBusy||this._deviceRoomsBusy;return j`
      <div class="row ${s?"moving":""}">
        ${this._statusDisc(this._moveStatus[e.id])}
        <div class="info"><div class="name">${e.name}</div></div>
        <select
          class="roomsel"
          ?disabled=${o}
          @change=${t=>this._onRoomChange(e,t.target.value)}
        >
          <option value="" ?selected=${""===i}>(unassigned)</option>
          ${t.map(e=>j`<option value=${e.id} ?selected=${i===e.id}>${e.name}</option>`)}
        </select>
      </div>
    `}_alexaSection(){const e=this._alexa;if(!e)return j`
        <section class="alexa-exp">
          <h2>Alexa devices <span class="exp">experimental</span></h2>
          <p class="muted">
            Review the device registrations on your Amazon account — your real Echos, plus the
            phantom app installs and duplicates that pile up. Needs Alexa Media Player logged in.
          </p>
          <button class="apply" ?disabled=${this._alexaBusy} @click=${this._previewAlexa}>
            ${this._alexaBusy?"Loading…":"Load devices"}
          </button>
        </section>
      `;if(!1===e.available)return j`
        <section class="alexa-exp">
          <h2>Alexa devices <span class="exp">experimental</span></h2>
          <div class="banner warn">
            Unavailable: ${e.reason??"no session"}. Install and log into Alexa Media Player.
          </div>
        </section>
      `;const t=e.devices??[],s=t.filter(e=>this._alexaRemove.has(e.id)),i=t.filter(e=>!e.protected&&!this._alexaRemove.has(e.id)),o=t.filter(e=>e.protected);return j`
      <section class="alexa-exp">
        <h2>Alexa devices <span class="exp">experimental</span></h2>
        <p class="muted">
          Toggle each device <b>Keep</b> or <b>Remove</b>. The removal suggestions are generic
          (companion-app entries and duplicate names) — you decide. Protected devices, and your
          Alexa Media Player session, can't be removed.
        </p>
        ${s.length?this._deviceGroup("Removing",s,"remove"):W}
        ${i.length?this._deviceGroup("Keeping",i,"keep"):W}
        ${o.length?this._deviceGroup("Protected",o,"protected"):W}
      </section>
    `}_deviceGroup(e,t,s){return j`
      <div class="kindgroup">
        <h3>${e} <span class="count">${t.length}</span></h3>
        <div class="rows">
          ${t.map(e=>j`
              <div class="row ${"remove"===s?"removing":""}">
                ${"remove"===s?j`<span class="minus">−</span>`:W}
                <div class="info"><div class="name">${e.name}</div></div>
                ${"protected"===s?j`<span class="tag">protected</span>`:j`<button
                      class="toggle ${"remove"===s?"rem":"keepbtn"}"
                      ?disabled=${this._alexaBusy}
                      @click=${()=>this._toggleDevice(e)}
                      title=${"remove"===s?"Set to remove — click to keep":"Keeping — click to remove"}
                    >
                      ${"remove"===s?"Remove":"Keep"}
                    </button>`}
              </div>
            `)}
        </div>
      </div>
    `}_deltaBar(){const e=this._summary,t=this._alexaRemove.size,s=this._roomInclude.size,i=this._moveCount+this._assignInclude.size,o=this._busy||this._alexaBusy||this._roomBusy||this._deviceRoomsBusy||this._assignBusy;return j`
      <div class="deltabar ${o?"busy":""}">
        <div class="flare"></div>
        <div class="deltabar-inner">
          <div class="chips">
            <span class="chip add" ?hidden=${!e.expose}>+${e.expose} expose</span>
            <span class="chip live" ?hidden=${!e.live_remove}>−${e.live_remove} unexpose</span>
            <span class="chip ghost" ?hidden=${!e.ghost_remove}>−${e.ghost_remove} stale</span>
            <span class="chip live" ?hidden=${!t}>−${t} device${1===t?"":"s"}</span>
            <span class="chip add" ?hidden=${!s}>${s} room${1===s?"":"s"}</span>
            <span class="chip add" ?hidden=${!i}>${i} move${1===i?"":"s"}</span>
          </div>
          <div class="applybtns">
            <button class="link" @click=${()=>this._detailsOpen=!this._detailsOpen}>
              ${this._detailsOpen?"Hide":"Details"}
            </button>
            <button class="apply" ?disabled=${o} @click=${this._applyAll}>
              ${o?"Applying…":"Apply all"}
            </button>
          </div>
        </div>
        ${this._detailsOpen?this._deltaDetails():W}
      </div>
    `}_deltaDetails(){const e=this._rows.filter(e=>e.desired!==e.exposed),t=(this._alexa?.devices??[]).filter(e=>this._alexaRemove.has(e.id)).map(e=>e.name).sort(),s=(this._roomPlan?.ops??[]).filter(e=>this._roomInclude.has(this._opKey(e))),i=(this._assignPlan?.assigns??[]).filter(e=>this._assignInclude.has(e.id)),o=Object.entries(this._moves),a=e=>(this._deviceRooms?.rooms??[]).find(t=>t.id===e)?.name??"(unassigned)",n=e=>(this._deviceRooms?.devices??[]).find(t=>t.id===e)?.name??e,r=!(e.length||this._ghosts.length||t.length||s.length||i.length||o.length);return j`
      <div class="deltadetails">
        ${e.map(e=>j`<div class="dline">
            <span class="${e.desired?"plus":"minus"}">${e.desired?"+":"−"}</span>
            ${e.desired?"expose":"unexpose"} · ${e.name}
          </div>`)}
        ${this._ghosts.map(e=>j`<div class="dline"><span class="minus">−</span> clean stale · ${e.entity_id}</div>`)}
        ${t.map(e=>j`<div class="dline"><span class="minus">−</span> remove device · ${e}</div>`)}
        ${s.map(e=>j`<div class="dline">
            <span class="${"create"===e.op?"plus":"minus"}">
              ${"create"===e.op?"+":"delete"===e.op?"−":"~"}
            </span>
            ${e.op} room · ${"rename"===e.op?j`${e.from} → ${e.to}`:e.name}
          </div>`)}
        ${i.map(e=>j`<div class="dline">
            <span class="plus">~</span> assign · ${e.name} → ${e.to_name}
          </div>`)}
        ${o.map(([e,t])=>j`<div class="dline">
            <span class="plus">~</span> move · ${n(e)} → ${t?a(t):"(unassigned)"}
          </div>`)}
        ${r?j`<div class="dline muted">No pending changes.</div>`:W}
      </div>
    `}_row(e){const t=e.desired!==e.exposed;return j`
      <div class="row">
        <div class="info">
          <div class="name">
            ${e.name}
            ${t?j`<span class="dot" title="pending"></span>`:W}
          </div>
          <div class="meta">
            <span class="kind">${pe[e.domain]??e.domain}</span>
            <span class="reason ${e.overridden?"label":""}">${e.reason}</span>
          </div>
        </div>
        <button
          class="toggle ${e.desired?"on":"off"}"
          ?disabled=${this._busy}
          @click=${()=>this._toggle(e)}
          title=${e.desired?"Exposed to Alexa — click to hide":"Hidden — click to expose"}
        >
          ${e.desired?"On":"Off"}
        </button>
      </div>
    `}_ghostSection(){return j`
      <section class="ghosts">
        <h2>Stale records <span class="count">${this._ghosts.length}</span></h2>
        <p class="muted">
          Exposed to Alexa but no longer in Home Assistant (Sonos re-discovery churn). Apply
          cleans these — it can't break anything, the devices are already gone.
        </p>
        <div class="rows">
          ${this._ghosts.map(e=>j`<div class="row ghost">
              <div class="info">
                <div class="name">${e.entity_id}</div>
                <div class="meta"><span class="reason">${e.reason}</span></div>
              </div>
              <span class="tag">will clean</span>
            </div>`)}
        </div>
      </section>
    `}};_e.styles=((e,...t)=>{const s=1===e.length?e[0]:t.reduce((t,s,i)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+e[i+1],e[0]);return new a(s,e,i)})`
    :host {
      display: block;
      background: var(--primary-background-color, #f5f5f5);
      min-height: 100%;
      color: var(--primary-text-color, #212121);
    }
    .wrap {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px 16px 88px;
      box-sizing: border-box;
    }
    header {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      align-items: flex-start;
      justify-content: space-between;
      padding: 8px 4px 16px;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .sub {
      margin: 4px 0 0;
      max-width: 46ch;
      color: var(--secondary-text-color, #727272);
      font-size: 0.85rem;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      white-space: nowrap;
    }
    .chip.add {
      background: color-mix(in srgb, var(--success-color, #4caf50) 18%, transparent);
      color: var(--success-color, #2e7d32);
    }
    .chip.live {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 20%, transparent);
      color: var(--warning-color, #e65100);
    }
    .chip.ghost {
      background: var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color, #616161);
    }
    .chip.ok {
      background: color-mix(in srgb, var(--success-color, #4caf50) 14%, transparent);
      color: var(--success-color, #2e7d32);
    }
    button.apply {
      border: none;
      border-radius: 8px;
      padding: 8px 18px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
    }
    button.apply:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .banner {
      border-radius: 8px;
      padding: 10px 14px;
      margin: 4px 0 12px;
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .banner.err {
      background: color-mix(in srgb, var(--error-color, #f44336) 14%, transparent);
      color: var(--error-color, #c62828);
    }
    .banner.warn {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 16%, transparent);
      color: var(--warning-color, #e65100);
    }
    .link {
      background: none;
      border: none;
      color: inherit;
      font: inherit;
      font-weight: 700;
      text-decoration: underline;
      cursor: pointer;
      padding: 0;
    }
    section {
      margin-bottom: 20px;
    }
    section.room {
      margin-bottom: 26px;
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary-text-color, #212121);
      margin: 4px 4px 6px;
    }
    h3 {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      color: var(--secondary-text-color, #727272);
      margin: 14px 4px 6px;
    }
    .kindgroup:first-of-type h3 {
      margin-top: 6px;
    }
    .count {
      font-weight: 400;
      opacity: 0.7;
    }
    .rows {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--divider-color, #ececec);
    }
    .row:last-child {
      border-bottom: none;
    }
    .info {
      flex: 1;
      min-width: 0;
    }
    .name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--primary-color, #03a9f4);
      flex: none;
    }
    .meta {
      font-size: 0.78rem;
      color: var(--secondary-text-color, #727272);
      margin-top: 2px;
    }
    .kind {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 1px 6px;
      margin-right: 6px;
      border-radius: 4px;
      background: var(--divider-color, #e8e8e8);
      color: var(--secondary-text-color, #616161);
      vertical-align: 1px;
    }
    .reason.label {
      color: var(--primary-color, #0288d1);
      font-weight: 600;
    }
    button.toggle {
      flex: none;
      width: 54px;
      border: 1px solid var(--divider-color, #cfcfcf);
      border-radius: 999px;
      padding: 5px 0;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #9e9e9e);
    }
    button.toggle.on {
      background: var(--primary-color, #03a9f4);
      color: var(--text-primary-color, #fff);
      border-color: var(--primary-color, #03a9f4);
    }
    button.toggle:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .row.ghost {
      opacity: 0.72;
    }
    .row.ghost .name {
      font-family: var(--code-font-family, monospace);
      font-size: 0.82rem;
      font-weight: 400;
    }
    .tag {
      flex: none;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--divider-color, #e0e0e0);
      color: var(--secondary-text-color, #616161);
    }
    .muted {
      color: var(--secondary-text-color, #727272);
      font-size: 0.82rem;
      line-height: 1.4;
      margin: 0 4px 8px;
    }
    .alexa-exp {
      margin-top: 22px;
    }
    .exp-divider {
      margin-top: 34px;
      padding-top: 18px;
      border-top: 2px solid var(--divider-color, #ddd);
    }
    .exp-heading {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0 4px 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .exp {
      font-size: 0.58rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      background: var(--warning-color, #ff9800);
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      vertical-align: 2px;
    }
    .ghostbtn {
      background: var(--secondary-background-color, #e0e0e0) !important;
      color: var(--primary-text-color, #212121) !important;
    }
    .applybar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      margin: 10px 0 14px;
    }
    .chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .applybtns {
      display: flex;
      gap: 8px;
      margin-left: auto;
      align-items: center;
    }
    .minus {
      flex: none;
      width: 14px;
      text-align: center;
      font-weight: 700;
      color: var(--error-color, #c62828);
    }
    .tag.remove {
      background: color-mix(in srgb, var(--error-color, #f44336) 15%, transparent);
      color: var(--error-color, #c62828);
    }
    button.toggle.rem {
      width: auto;
      padding: 5px 12px;
      background: var(--error-color, #c62828);
      color: #fff;
      border-color: var(--error-color, #c62828);
    }
    button.toggle.keepbtn {
      width: auto;
      padding: 5px 12px;
    }
    .row.removing .name {
      color: var(--error-color, #c62828);
    }
    .roomsel {
      flex: none;
      max-width: 190px;
      padding: 5px 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color, #cfcfcf);
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color, #212121);
      font: inherit;
      font-size: 0.85rem;
    }
    .row.moving {
      background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, transparent);
    }
    .row.moving .name {
      color: var(--primary-color, #0288d1);
    }
    .deltabar {
      position: fixed;
      bottom: 16px;
      /* Centered on the tool (host), not the viewport — set from JS. */
      left: var(--ac-bar-left, 50%);
      transform: translateX(-50%);
      width: var(--ac-bar-width, min(680px, calc(100vw - 32px)));
      z-index: 20;
      overflow: hidden;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #ddd);
      border-radius: 14px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    }
    .deltabar .flare {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        100deg,
        transparent 35%,
        color-mix(in srgb, var(--primary-color, #03a9f4) 22%, transparent) 50%,
        color-mix(in srgb, var(--success-color, #4caf50) 18%, transparent) 60%,
        transparent 72%
      );
      background-size: 220% 100%;
      animation: flare-sweep 3s linear infinite;
    }
    .deltabar.busy .flare {
      animation-duration: 1.1s;
    }
    @keyframes flare-sweep {
      from {
        background-position: 220% 0;
      }
      to {
        background-position: -120% 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .deltabar .flare {
        animation: none;
      }
    }
    .deltabar-inner {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
    }
    .delta-count {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .headernote {
      align-self: center;
    }
    .deltadetails {
      position: relative;
      max-height: 42vh;
      overflow-y: auto;
      padding: 6px 14px 12px;
      border-top: 1px solid var(--divider-color, #eee);
    }
    .dline {
      font-size: 0.82rem;
      padding: 3px 0;
      display: flex;
      gap: 6px;
      align-items: baseline;
    }
    .plus {
      color: var(--success-color, #2e7d32);
      font-weight: 700;
      width: 14px;
      text-align: center;
      flex: none;
    }
    .state {
      flex: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      font-weight: 700;
      line-height: 1;
      box-sizing: border-box;
    }
    .state.pending {
      width: 8px;
      height: 8px;
      margin: 0 5px;
      background: var(--divider-color, #cfcfcf);
    }
    .state.running {
      border: 2px solid var(--divider-color, #ddd);
      border-top-color: var(--primary-color, #03a9f4);
      animation: spin 0.7s linear infinite;
    }
    .state.done {
      background: var(--success-color, #2e7d32);
      color: #fff;
    }
    .state.error {
      background: var(--error-color, #c62828);
      color: #fff;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    .rows.scroll {
      max-height: 240px;
      overflow-y: auto;
      margin-top: 4px;
    }
    code {
      background: var(--divider-color, #eee);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 0.85em;
    }
    [hidden] {
      display: none !important;
    }
  `,e([ce({attribute:!1})],_e.prototype,"hass",void 0),e([ce({attribute:!1})],_e.prototype,"narrow",void 0),e([he()],_e.prototype,"_rows",void 0),e([he()],_e.prototype,"_summary",void 0),e([he()],_e.prototype,"_loading",void 0),e([he()],_e.prototype,"_busy",void 0),e([he()],_e.prototype,"_held",void 0),e([he()],_e.prototype,"_unavailable",void 0),e([he()],_e.prototype,"_alexa",void 0),e([he()],_e.prototype,"_alexaBusy",void 0),e([he()],_e.prototype,"_alexaRemove",void 0),e([he()],_e.prototype,"_detailsOpen",void 0),e([he()],_e.prototype,"_roomPlan",void 0),e([he()],_e.prototype,"_roomBusy",void 0),e([he()],_e.prototype,"_roomInclude",void 0),e([he()],_e.prototype,"_roomStatus",void 0),e([he()],_e.prototype,"_deviceRooms",void 0),e([he()],_e.prototype,"_deviceRoomsBusy",void 0),e([he()],_e.prototype,"_moves",void 0),e([he()],_e.prototype,"_moveStatus",void 0),e([he()],_e.prototype,"_assignPlan",void 0),e([he()],_e.prototype,"_assignBusy",void 0),e([he()],_e.prototype,"_assignInclude",void 0),e([he()],_e.prototype,"_assignStatus",void 0),_e=e([(e=>(t,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)})("alexa-panel")],_e);export{_e as AlexaPanel};
