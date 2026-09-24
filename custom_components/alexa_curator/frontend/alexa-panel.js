function t(t,e,s,i){var o,r=arguments.length,n=r<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(r<3?o(n):r>3?o(e,s,n):o(e,s))||n);return r>3&&n&&Object.defineProperty(e,s,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),o=new WeakMap;let r=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&o.set(e,t))}return t}toString(){return this.cssText}};const n=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:a,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:h,getOwnPropertySymbols:d,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,f=g?g.emptyScript:"",m=u.reactiveElementPolyfillSupport,_=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},$=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&l(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:o}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const r=i?.call(this);o?.call(this,e),this.requestUpdate(t,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...h(t),...d(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,i)=>{if(s)t.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of i){const i=document.createElement("style"),o=e.litNonce;void 0!==o&&i.setAttribute("nonce",o),i.textContent=s.cssText,t.appendChild(i)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const o=(void 0!==s.converter?.toAttribute?s.converter:v).toAttribute(e,s.type);this._$Em=t,null==o?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=i;const r=o.fromAttribute(e,t.type);this[i]=r??this._$Ej?.get(i)??r,this._$Em=null}}requestUpdate(t,e,s,i=!1,o){if(void 0!==t){const r=this.constructor;if(!1===i&&(o=this[t]),s??=r.getPropertyOptions(t),!((s.hasChanged??$)(o,e)||s.useDefault&&s.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:o},r){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==o||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[_("elementProperties")]=new Map,x[_("finalized")]=new Map,m?.({ReactiveElement:x}),(u.reactiveElementVersions??=[]).push("2.1.2");const b=globalThis,w=t=>t,A=b.trustedTypes,E=A?A.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+k,P=`<${C}>`,O=document,U=()=>O.createComment(""),M=t=>null===t||"object"!=typeof t&&"function"!=typeof t,T=Array.isArray,H="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,z=/-->/g,R=/>/g,j=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),D=/'/g,B=/"/g,L=/^(?:script|style|textarea|title)$/i,I=(t=>(e,...s)=>({_$litType$:t,strings:e,values:s}))(1),q=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),W=new WeakMap,F=O.createTreeWalker(O,129);function J(t,e){if(!T(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const K=(t,e)=>{const s=t.length-1,i=[];let o,r=2===e?"<svg>":3===e?"<math>":"",n=N;for(let e=0;e<s;e++){const s=t[e];let a,l,c=-1,h=0;for(;h<s.length&&(n.lastIndex=h,l=n.exec(s),null!==l);)h=n.lastIndex,n===N?"!--"===l[1]?n=z:void 0!==l[1]?n=R:void 0!==l[2]?(L.test(l[2])&&(o=RegExp("</"+l[2],"g")),n=j):void 0!==l[3]&&(n=j):n===j?">"===l[0]?(n=o??N,c=-1):void 0===l[1]?c=-2:(c=n.lastIndex-l[2].length,a=l[1],n=void 0===l[3]?j:'"'===l[3]?B:D):n===B||n===D?n=j:n===z||n===R?n=N:(n=j,o=void 0);const d=n===j&&t[e+1].startsWith("/>")?" ":"";r+=n===N?s+P:c>=0?(i.push(a),s.slice(0,c)+S+s.slice(c)+k+d):s+k+(-2===c?e:d)}return[J(t,r+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class Z{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let o=0,r=0;const n=t.length-1,a=this.parts,[l,c]=K(t,e);if(this.el=Z.createElement(l,s),F.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=F.nextNode())&&a.length<n;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(S)){const e=c[r++],s=i.getAttribute(t).split(k),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:s,ctor:"."===n[1]?tt:"?"===n[1]?et:"@"===n[1]?st:Y}),i.removeAttribute(t)}else t.startsWith(k)&&(a.push({type:6,index:o}),i.removeAttribute(t));if(L.test(i.tagName)){const t=i.textContent.split(k),e=t.length-1;if(e>0){i.textContent=A?A.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],U()),F.nextNode(),a.push({type:2,index:++o});i.append(t[e],U())}}}else if(8===i.nodeType)if(i.data===C)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=i.data.indexOf(k,t+1));)a.push({type:7,index:o}),t+=k.length-1}o++}}static createElement(t,e){const s=O.createElement("template");return s.innerHTML=t,s}}function G(t,e,s=t,i){if(e===q)return e;let o=void 0!==i?s._$Co?.[i]:s._$Cl;const r=M(e)?void 0:e._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(t),o._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=o:s._$Cl=o),void 0!==o&&(e=G(t,o._$AS(t,e.values),o,i)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??O).importNode(e,!0);F.currentNode=i;let o=F.nextNode(),r=0,n=0,a=s[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new X(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new it(o,this,t)),this._$AV.push(e),a=s[++n]}r!==a?.index&&(o=F.nextNode(),r++)}return F.currentNode=O,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=G(this,t,e),M(t)?t===V||null==t||""===t?(this._$AH!==V&&this._$AR(),this._$AH=V):t!==this._$AH&&t!==q&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>T(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==V&&M(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Z.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new Q(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=W.get(t.strings);return void 0===e&&W.set(t.strings,e=new Z(t)),e}k(t){T(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const o of t)i===e.length?e.push(s=new X(this.O(U()),this.O(U()),this,this.options)):s=e[i],s._$AI(o),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=w(t).nextSibling;w(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Y{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,o){this.type=1,this._$AH=V,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=V}_$AI(t,e=this,s,i){const o=this.strings;let r=!1;if(void 0===o)t=G(this,t,e,0),r=!M(t)||t!==this._$AH&&t!==q,r&&(this._$AH=t);else{const i=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=G(this,i[s+n],e,n),a===q&&(a=this._$AH[n]),r||=!M(a)||a!==this._$AH[n],a===V?t=V:t!==V&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}r&&!i&&this.j(t)}j(t){t===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends Y{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===V?void 0:t}}class et extends Y{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==V)}}class st extends Y{constructor(t,e,s,i,o){super(t,e,s,i,o),this.type=5}_$AI(t,e=this){if((t=G(this,t,e,0)??V)===q)return;const s=this._$AH,i=t===V&&s!==V||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==V&&(s===V||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class it{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){G(this,t)}}const ot=b.litHtmlPolyfillSupport;ot?.(Z,X),(b.litHtmlVersions??=[]).push("3.3.3");const rt=globalThis;class nt extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let o=i._$litPart$;if(void 0===o){const t=s?.renderBefore??null;i._$litPart$=o=new X(e.insertBefore(U(),t),t,void 0,s??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}nt._$litElement$=!0,nt.finalized=!0,rt.litElementHydrateSupport?.({LitElement:nt});const at=rt.litElementPolyfillSupport;at?.({LitElement:nt}),(rt.litElementVersions??=[]).push("4.2.2");const lt={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:$},ct=(t=lt,e,s)=>{const{kind:i,metadata:o}=s;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),r.set(s.name,t),"accessor"===i){const{name:i}=s;return{set(s){const o=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,o,t,!0,s)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){const{name:i}=s;return function(s){const o=this[i];e.call(this,s),this.requestUpdate(i,o,t,!0,s)}}throw Error("Unsupported decorator location: "+i)};function ht(t){return(e,s)=>"object"==typeof s?ct(t,e,s):((t,e,s)=>{const i=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),i?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function dt(t){return ht({...t,state:!0,attribute:!1})}const pt={media_player:"Speaker",light:"Light",switch:"Switch",climate:"Climate",scene:"Scene",script:"Script",cover:"Cover",fan:"Fan",vacuum:"Vacuum",lock:"Lock",camera:"Camera",input_boolean:"Toggle"},ut=[{label:"Lighting",domains:["light","switch"]},{label:"Speakers",domains:["media_player"]},{label:"Climate",domains:["climate","fan"]},{label:"Scenes & routines",domains:["scene","script"]},{label:"Other",domains:["cover","vacuum","lock","camera","input_boolean"]}],gt={};ut.forEach((t,e)=>t.domains.forEach(t=>gt[t]=e));const ft=t=>gt[t]??ut.length-1;let mt=class extends nt{constructor(){super(...arguments),this.narrow=!1,this._rows=[],this._summary={expose:0,live_remove:0,ghost_remove:0},this._loading=!0,this._busy=!1,this._held=!1,this._unavailable=null,this._alexa=null,this._alexaBusy=!1}connectedCallback(){super.connectedCallback(),this._load()}async _load(){this._loading=!0;try{const t=await this.hass.connection.sendMessagePromise({type:"alexa_curator/inventory"});this._ingest(t)}finally{this._loading=!1}}_ingest(t){this._rows=t.rows,this._summary=t.summary,this._unavailable=t.unavailable??null}async _toggle(t){if(!t.ghost&&!this._busy){this._busy=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_curator/set",entity_id:t.entity_id,expose:!t.desired});this._ingest(e)}finally{this._busy=!1}}}async _apply(t){if(!this._busy){this._busy=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_curator/apply",force:t});this._held=e.held,this._ingest(e.inventory)}finally{this._busy=!1}}}async _previewAlexa(){if(!this._alexaBusy){this._alexaBusy=!0;try{this._alexa=await this.hass.connection.sendMessagePromise({type:"alexa_curator/alexa_devices"})}finally{this._alexaBusy=!1}}}get _nothingToDo(){const t=this._summary;return t.expose+t.live_remove+t.ghost_remove===0}_rooms(){const t=new Map;for(const e of this._rows){if(e.ghost)continue;const s=e.area??"",i=t.get(s);i?i.push(e):t.set(s,[e])}const e=[...t.keys()].sort((t,e)=>""===t?1:""===e?-1:t.localeCompare(e));return e.map(e=>{const s=ut.map(()=>[]);for(const i of t.get(e))s[ft(i.domain)].push(i);const i=ut.map((t,e)=>({label:t.label,rows:s[e].slice().sort((t,e)=>t.name.localeCompare(e.name))})).filter(t=>t.rows.length>0);return{area:""===e?"No room":e,groups:i}})}get _ghosts(){return this._rows.filter(t=>t.ghost)}render(){if(this._loading)return I`<div class="wrap"><p class="muted">Loading exposure…</p></div>`;const t=this._summary;return I`
      <div class="wrap">
        <header>
          <div class="titles">
            <h1>Alexa Curator</h1>
            <p class="sub">
              Grouped by your Home Assistant areas. Controls what Alexa sees — organize the
              actual rooms &amp; groups in the Alexa app.
            </p>
          </div>
          <div class="actions">
            <span class="chip add" ?hidden=${!t.expose}>+${t.expose} expose</span>
            <span class="chip live" ?hidden=${!t.live_remove}>−${t.live_remove} live</span>
            <span class="chip ghost" ?hidden=${!t.ghost_remove}>−${t.ghost_remove} stale</span>
            <span class="chip ok" ?hidden=${!this._nothingToDo}>In sync</span>
            <button
              class="apply"
              ?disabled=${this._nothingToDo||this._busy}
              @click=${()=>this._apply(!1)}
            >
              ${this._busy?"Applying…":"Apply"}
            </button>
          </div>
        </header>

        ${this._unavailable?I`<div class="banner err">
              Can't read Alexa exposure (${this._unavailable}). Nothing was changed.
            </div>`:V}

        ${this._held?I`<div class="banner warn">
              Held ${t.live_remove} live removal(s) for safety — additions and stale cleanup
              were applied. Review the list, then
              <button class="link" @click=${()=>this._apply(!0)}>force apply</button>.
            </div>`:V}

        ${this._rooms().map(t=>I`
            <section class="room">
              <h2>
                ${t.area}
                <span class="count">${t.groups.reduce((t,e)=>t+e.rows.length,0)}</span>
              </h2>
              ${t.groups.map(t=>I`
                  <div class="kindgroup">
                    <h3>${t.label}</h3>
                    <div class="rows">${t.rows.map(t=>this._row(t))}</div>
                  </div>
                `)}
            </section>
          `)}
        ${this._ghosts.length?this._ghostSection():V}
        ${this._alexaSection()}
      </div>
    `}_alexaSection(){const t=this._alexa;return I`
      <section class="alexa-exp">
        <h2>Alexa devices <span class="exp">experimental</span></h2>
        <p class="muted">
          Preview the stale device registrations on your Amazon account — old phones, duplicate
          Echo Buds, dead app installs. Needs the Alexa Media Player integration logged in.
        </p>
        ${t?!1===t.available?I`<div class="banner warn">
                Unavailable: ${t.reason??"no session"}. Install and log into Alexa Media Player.
              </div>`:I`
                <div class="actions">
                  <span class="chip live" ?hidden=${!t.junk.length}>${t.junk.length} flagged</span>
                  <span class="chip ghost">${t.protected.length} protected</span>
                  <span class="chip ok">${t.keep.length} keep</span>
                </div>
                <div class="rows scroll">
                  ${t.junk.map(t=>I`<div class="row"><div class="info"><div class="name">${t}</div></div></div>`)}
                </div>
                <p class="muted">
                  Protected, never touched: ${t.protected.join(", ")||"none"}. To act on the
                  ${t.junk.length} flagged, run the <code>alexa_curator.alexa_devices</code> action
                  with <code>apply: true</code>.
                </p>
              `:I`<button class="apply" ?disabled=${this._alexaBusy} @click=${this._previewAlexa}>
              ${this._alexaBusy?"Loading…":"Preview"}
            </button>`}
      </section>
    `}_row(t){const e=t.desired!==t.exposed;return I`
      <div class="row">
        <div class="info">
          <div class="name">
            ${t.name}
            ${e?I`<span class="dot" title="pending"></span>`:V}
          </div>
          <div class="meta">
            <span class="kind">${pt[t.domain]??t.domain}</span>
            <span class="reason ${t.overridden?"label":""}">${t.reason}</span>
          </div>
        </div>
        <button
          class="toggle ${t.desired?"on":"off"}"
          ?disabled=${this._busy}
          @click=${()=>this._toggle(t)}
          title=${t.desired?"Exposed to Alexa — click to hide":"Hidden — click to expose"}
        >
          ${t.desired?"On":"Off"}
        </button>
      </div>
    `}_ghostSection(){return I`
      <section class="ghosts">
        <h2>Stale records <span class="count">${this._ghosts.length}</span></h2>
        <p class="muted">
          Exposed to Alexa but no longer in Home Assistant (Sonos re-discovery churn). Apply
          cleans these — it can't break anything, the devices are already gone.
        </p>
        <div class="rows">
          ${this._ghosts.map(t=>I`<div class="row ghost">
              <div class="info">
                <div class="name">${t.entity_id}</div>
                <div class="meta"><span class="reason">${t.reason}</span></div>
              </div>
              <span class="tag">will clean</span>
            </div>`)}
        </div>
      </section>
    `}};mt.styles=((t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new r(s,t,i)})`
    :host {
      display: block;
      background: var(--primary-background-color, #f5f5f5);
      min-height: 100%;
      color: var(--primary-text-color, #212121);
    }
    .wrap {
      max-width: 900px;
      margin: 0 auto;
      padding: 16px;
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
      margin-top: 30px;
      border-top: 1px dashed var(--divider-color, #ccc);
      padding-top: 16px;
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
  `,t([ht({attribute:!1})],mt.prototype,"hass",void 0),t([ht({attribute:!1})],mt.prototype,"narrow",void 0),t([dt()],mt.prototype,"_rows",void 0),t([dt()],mt.prototype,"_summary",void 0),t([dt()],mt.prototype,"_loading",void 0),t([dt()],mt.prototype,"_busy",void 0),t([dt()],mt.prototype,"_held",void 0),t([dt()],mt.prototype,"_unavailable",void 0),t([dt()],mt.prototype,"_alexa",void 0),t([dt()],mt.prototype,"_alexaBusy",void 0),mt=t([(t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("alexa-panel")],mt);export{mt as AlexaPanel};
