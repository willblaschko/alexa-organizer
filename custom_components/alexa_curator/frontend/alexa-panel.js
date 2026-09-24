function e(e,t,s,i){var o,r=arguments.length,a=r<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,s,i);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(r<3?o(a):r>3?o(t,s,a):o(t,s))||a);return r>3&&a&&Object.defineProperty(t,s,a),a}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,s=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),o=new WeakMap;let r=class{constructor(e,t,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(s&&void 0===e){const s=void 0!==t&&1===t.length;s&&(e=o.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),s&&o.set(t,e))}return e}toString(){return this.cssText}};const a=s?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const s of e.cssRules)t+=s.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:n,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:h}=Object,u=globalThis,g=u.trustedTypes,m=g?g.emptyScript:"",v=u.reactiveElementPolyfillSupport,_=(e,t)=>e,f={toAttribute(e,t){switch(t){case Boolean:e=e?m:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let s=e;switch(t){case Boolean:s=null!==e;break;case Number:s=null===e?null:Number(e);break;case Object:case Array:try{s=JSON.parse(e)}catch(e){s=null}}return s}},y=(e,t)=>!n(e,t),x={attribute:!0,type:String,converter:f,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(e,s,t);void 0!==i&&l(this.prototype,e,i)}}static getPropertyDescriptor(e,t,s){const{get:i,set:o}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:i,set(t){const r=i?.call(this);o?.call(this,t),this.requestUpdate(e,r,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const e=h(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const e=this.properties,t=[...d(e),...p(e)];for(const s of t)this.createProperty(s,e[s])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,s]of t)this.elementProperties.set(e,s)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const s=this._$Eu(e,t);void 0!==s&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const s=new Set(e.flat(1/0).reverse());for(const e of s)t.unshift(a(e))}else void 0!==e&&t.push(a(e));return t}static _$Eu(e,t){const s=t.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const s of t.keys())this.hasOwnProperty(s)&&(e.set(s,this[s]),delete this[s]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,i)=>{if(s)e.adoptedStyleSheets=i.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const s of i){const i=document.createElement("style"),o=t.litNonce;void 0!==o&&i.setAttribute("nonce",o),i.textContent=s.cssText,e.appendChild(i)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,s){this._$AK(e,s)}_$ET(e,t){const s=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,s);if(void 0!==i&&!0===s.reflect){const o=(void 0!==s.converter?.toAttribute?s.converter:f).toAttribute(t,s.type);this._$Em=e,null==o?this.removeAttribute(i):this.setAttribute(i,o),this._$Em=null}}_$AK(e,t){const s=this.constructor,i=s._$Eh.get(e);if(void 0!==i&&this._$Em!==i){const e=s.getPropertyOptions(i),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:f;this._$Em=i;const r=o.fromAttribute(t,e.type);this[i]=r??this._$Ej?.get(i)??r,this._$Em=null}}requestUpdate(e,t,s,i=!1,o){if(void 0!==e){const r=this.constructor;if(!1===i&&(o=this[e]),s??=r.getPropertyOptions(e),!((s.hasChanged??y)(o,t)||s.useDefault&&s.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,s))))return;this.C(e,t,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:s,reflect:i,wrapped:o},r){s&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==o||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||s||(t=void 0),this._$AL.set(e,t)),!0===i&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,s]of e){const{wrapped:e}=s,i=this[t];!0!==e||this._$AL.has(t)||void 0===i||this.C(t,void 0,s,i)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[_("elementProperties")]=new Map,$[_("finalized")]=new Map,v?.({ReactiveElement:$}),(u.reactiveElementVersions??=[]).push("2.1.2");const b=globalThis,w=e=>e,A=b.trustedTypes,S=A?A.createPolicy("lit-html",{createHTML:e=>e}):void 0,E="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+k,C=`<${P}>`,R=document,O=()=>R.createComment(""),M=e=>null===e||"object"!=typeof e&&"function"!=typeof e,U=Array.isArray,H="[ \t\n\f\r]",z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,N=/>/g,B=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),D=/'/g,j=/"/g,L=/^(?:script|style|textarea|title)$/i,I=(e=>(t,...s)=>({_$litType$:e,strings:t,values:s}))(1),q=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),W=new WeakMap,G=R.createTreeWalker(R,129);function K(e,t){if(!U(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(t):t}const F=(e,t)=>{const s=e.length-1,i=[];let o,r=2===t?"<svg>":3===t?"<math>":"",a=z;for(let t=0;t<s;t++){const s=e[t];let n,l,c=-1,d=0;for(;d<s.length&&(a.lastIndex=d,l=a.exec(s),null!==l);)d=a.lastIndex,a===z?"!--"===l[1]?a=T:void 0!==l[1]?a=N:void 0!==l[2]?(L.test(l[2])&&(o=RegExp("</"+l[2],"g")),a=B):void 0!==l[3]&&(a=B):a===B?">"===l[0]?(a=o??z,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,n=l[1],a=void 0===l[3]?B:'"'===l[3]?j:D):a===j||a===D?a=B:a===T||a===N?a=z:(a=B,o=void 0);const p=a===B&&e[t+1].startsWith("/>")?" ":"";r+=a===z?s+C:c>=0?(i.push(n),s.slice(0,c)+E+s.slice(c)+k+p):s+k+(-2===c?t:p)}return[K(e,r+(e[s]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),i]};class J{constructor({strings:e,_$litType$:t},s){let i;this.parts=[];let o=0,r=0;const a=e.length-1,n=this.parts,[l,c]=F(e,t);if(this.el=J.createElement(l,s),G.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(i=G.nextNode())&&n.length<a;){if(1===i.nodeType){if(i.hasAttributes())for(const e of i.getAttributeNames())if(e.endsWith(E)){const t=c[r++],s=i.getAttribute(e).split(k),a=/([.?@])?(.*)/.exec(t);n.push({type:1,index:o,name:a[2],strings:s,ctor:"."===a[1]?ee:"?"===a[1]?te:"@"===a[1]?se:X}),i.removeAttribute(e)}else e.startsWith(k)&&(n.push({type:6,index:o}),i.removeAttribute(e));if(L.test(i.tagName)){const e=i.textContent.split(k),t=e.length-1;if(t>0){i.textContent=A?A.emptyScript:"";for(let s=0;s<t;s++)i.append(e[s],O()),G.nextNode(),n.push({type:2,index:++o});i.append(e[t],O())}}}else if(8===i.nodeType)if(i.data===P)n.push({type:2,index:o});else{let e=-1;for(;-1!==(e=i.data.indexOf(k,e+1));)n.push({type:7,index:o}),e+=k.length-1}o++}}static createElement(e,t){const s=R.createElement("template");return s.innerHTML=e,s}}function Z(e,t,s=e,i){if(t===q)return t;let o=void 0!==i?s._$Co?.[i]:s._$Cl;const r=M(t)?void 0:t._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(e),o._$AT(e,s,i)),void 0!==i?(s._$Co??=[])[i]=o:s._$Cl=o),void 0!==o&&(t=Z(e,o._$AS(e,t.values),o,i)),t}class Y{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:s}=this._$AD,i=(e?.creationScope??R).importNode(t,!0);G.currentNode=i;let o=G.nextNode(),r=0,a=0,n=s[0];for(;void 0!==n;){if(r===n.index){let t;2===n.type?t=new Q(o,o.nextSibling,this,e):1===n.type?t=new n.ctor(o,n.name,n.strings,this,e):6===n.type&&(t=new ie(o,this,e)),this._$AV.push(t),n=s[++a]}r!==n?.index&&(o=G.nextNode(),r++)}return G.currentNode=R,i}p(e){let t=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(e,s,t),t+=s.strings.length-2):s._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,s,i){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),M(e)?e===V||null==e||""===e?(this._$AH!==V&&this._$AR(),this._$AH=V):e!==this._$AH&&e!==q&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>U(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==V&&M(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:s}=e,i="number"==typeof s?this._$AC(e):(void 0===s.el&&(s.el=J.createElement(K(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(t);else{const e=new Y(i,this),s=e.u(this.options);e.p(t),this.T(s),this._$AH=e}}_$AC(e){let t=W.get(e.strings);return void 0===t&&W.set(e.strings,t=new J(e)),t}k(e){U(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let s,i=0;for(const o of e)i===t.length?t.push(s=new Q(this.O(O()),this.O(O()),this,this.options)):s=t[i],s._$AI(o),i++;i<t.length&&(this._$AR(s&&s._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,s,i,o){this.type=1,this._$AH=V,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=V}_$AI(e,t=this,s,i){const o=this.strings;let r=!1;if(void 0===o)e=Z(this,e,t,0),r=!M(e)||e!==this._$AH&&e!==q,r&&(this._$AH=e);else{const i=e;let a,n;for(e=o[0],a=0;a<o.length-1;a++)n=Z(this,i[s+a],t,a),n===q&&(n=this._$AH[a]),r||=!M(n)||n!==this._$AH[a],n===V?e=V:e!==V&&(e+=(n??"")+o[a+1]),this._$AH[a]=n}r&&!i&&this.j(e)}j(e){e===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends X{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===V?void 0:e}}class te extends X{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==V)}}class se extends X{constructor(e,t,s,i,o){super(e,t,s,i,o),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??V)===q)return;const s=this._$AH,i=e===V&&s!==V||e.capture!==s.capture||e.once!==s.once||e.passive!==s.passive,o=e!==V&&(s===V||i);i&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ie{constructor(e,t,s){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}}const oe=b.litHtmlPolyfillSupport;oe?.(J,Q),(b.litHtmlVersions??=[]).push("3.3.3");const re=globalThis;class ae extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,s)=>{const i=s?.renderBefore??t;let o=i._$litPart$;if(void 0===o){const e=s?.renderBefore??null;i._$litPart$=o=new Q(t.insertBefore(O(),e),e,void 0,s??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}ae._$litElement$=!0,ae.finalized=!0,re.litElementHydrateSupport?.({LitElement:ae});const ne=re.litElementPolyfillSupport;ne?.({LitElement:ae}),(re.litElementVersions??=[]).push("4.2.2");const le={attribute:!0,type:String,converter:f,reflect:!1,hasChanged:y},ce=(e=le,t,s)=>{const{kind:i,metadata:o}=s;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===i&&((e=Object.create(e)).wrapped=!0),r.set(s.name,e),"accessor"===i){const{name:i}=s;return{set(s){const o=t.get.call(this);t.set.call(this,s),this.requestUpdate(i,o,e,!0,s)},init(t){return void 0!==t&&this.C(i,void 0,e,t),t}}}if("setter"===i){const{name:i}=s;return function(s){const o=this[i];t.call(this,s),this.requestUpdate(i,o,e,!0,s)}}throw Error("Unsupported decorator location: "+i)};function de(e){return(t,s)=>"object"==typeof s?ce(e,t,s):((e,t,s)=>{const i=t.hasOwnProperty(s);return t.constructor.createProperty(s,e),i?Object.getOwnPropertyDescriptor(t,s):void 0})(e,t,s)}function pe(e){return de({...e,state:!0,attribute:!1})}const he={media_player:"Speaker",light:"Light",switch:"Switch",climate:"Climate",scene:"Scene",script:"Script",cover:"Cover",fan:"Fan",vacuum:"Vacuum",lock:"Lock",camera:"Camera",input_boolean:"Toggle"},ue=[{label:"Lighting",domains:["light","switch"]},{label:"Speakers",domains:["media_player"]},{label:"Climate",domains:["climate","fan"]},{label:"Scenes & routines",domains:["scene","script"]},{label:"Other",domains:["cover","vacuum","lock","camera","input_boolean"]}],ge={};ue.forEach((e,t)=>e.domains.forEach(e=>ge[e]=t));const me=e=>ge[e]??ue.length-1;let ve=class extends ae{constructor(){super(...arguments),this.narrow=!1,this._rows=[],this._summary={expose:0,live_remove:0,ghost_remove:0},this._loading=!0,this._busy=!1,this._held=!1,this._unavailable=null,this._alexa=null,this._alexaBusy=!1,this._alexaRemove=new Set,this._detailsOpen=!1,this._roomPlan=null,this._roomBusy=!1}connectedCallback(){super.connectedCallback(),this._load()}async _load(){this._loading=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_curator/inventory"});this._ingest(e)}finally{this._loading=!1}}_ingest(e){this._rows=e.rows,this._summary=e.summary,this._unavailable=e.unavailable??null}async _toggle(e){if(!e.ghost&&!this._busy){this._busy=!0;try{const t=await this.hass.connection.sendMessagePromise({type:"alexa_curator/set",entity_id:e.entity_id,expose:!e.desired});this._ingest(t)}finally{this._busy=!1}}}async _apply(e){if(!this._busy){this._busy=!0;try{const t=await this.hass.connection.sendMessagePromise({type:"alexa_curator/apply",force:e});this._held=t.held,this._ingest(t.inventory)}finally{this._busy=!1}}}async _previewAlexa(){if(!this._alexaBusy){this._alexaBusy=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_curator/alexa_devices"});this._alexa=e,this._alexaRemove=new Set((e.devices??[]).filter(e=>e.suggested_remove&&!e.protected).map(e=>e.id))}finally{this._alexaBusy=!1}}}_toggleDevice(e){if(e.protected)return;const t=new Set(this._alexaRemove);t.has(e.id)?t.delete(e.id):t.add(e.id),this._alexaRemove=t}async _applyAlexaSelected(){if(!this._alexaBusy&&0!==this._alexaRemove.size){this._alexaBusy=!0;try{await this.hass.callService("alexa_curator","alexa_devices",{apply:!0,endpoint_ids:[...this._alexaRemove]});const e=await this.hass.connection.sendMessagePromise({type:"alexa_curator/alexa_devices"});this._alexa=e;const t=new Set((e.devices??[]).map(e=>e.id));this._alexaRemove=new Set([...this._alexaRemove].filter(e=>t.has(e)))}finally{this._alexaBusy=!1}}}get _nothingToDo(){const e=this._summary;return e.expose+e.live_remove+e.ghost_remove===0}_rooms(){const e=new Map;for(const t of this._rows){if(t.ghost)continue;const s=t.area??"",i=e.get(s);i?i.push(t):e.set(s,[t])}const t=[...e.keys()].sort((e,t)=>""===e?1:""===t?-1:e.localeCompare(t));return t.map(t=>{const s=ue.map(()=>[]);for(const i of e.get(t))s[me(i.domain)].push(i);const i=ue.map((e,t)=>({label:e.label,rows:s[t].slice().sort((e,t)=>e.name.localeCompare(t.name))})).filter(e=>e.rows.length>0);return{area:""===t?"No room":t,groups:i}})}get _ghosts(){return this._rows.filter(e=>e.ghost)}render(){if(this._loading)return I`<div class="wrap"><p class="muted">Loading exposure…</p></div>`;const e=this._summary;return I`
      <div class="wrap">
        <header>
          <div class="titles">
            <h1>Alexa Curator</h1>
            <p class="sub">
              Grouped by your Home Assistant areas. Controls what Alexa sees — organize the
              actual rooms &amp; groups in the Alexa app.
            </p>
          </div>
          <span class="chip ok headernote" ?hidden=${this._hasPending}>In sync</span>
        </header>

        ${this._unavailable?I`<div class="banner err">
              Can't read Alexa exposure (${this._unavailable}). Nothing was changed.
            </div>`:V}

        ${this._held?I`<div class="banner warn">
              Held ${e.live_remove} live removal(s) for safety — additions and stale cleanup
              were applied. Review the list, then
              <button class="link" @click=${()=>this._apply(!0)}>force apply</button>.
            </div>`:V}

        ${this._rooms().map(e=>I`
            <section class="room">
              <h2>
                ${e.area}
                <span class="count">${e.groups.reduce((e,t)=>e+t.rows.length,0)}</span>
              </h2>
              ${e.groups.map(e=>I`
                  <div class="kindgroup">
                    <h3>${e.label}</h3>
                    <div class="rows">${e.rows.map(e=>this._row(e))}</div>
                  </div>
                `)}
            </section>
          `)}
        ${this._ghosts.length?this._ghostSection():V}
        ${this._roomSection()}
        ${this._alexaSection()}
      </div>
      ${this._hasPending?this._deltaBar():V}
    `}get _hasExposure(){return!this._nothingToDo}get _hasPending(){return this._hasExposure||this._alexaRemove.size>0}async _applyAll(){this._busy||this._alexaBusy||(this._hasExposure&&await this._apply(!1),this._alexaRemove.size>0&&await this._applyAlexaSelected())}async _loadRoomPlan(){if(!this._roomBusy){this._roomBusy=!0;try{this._roomPlan=await this.hass.connection.sendMessagePromise({type:"alexa_curator/room_plan"})}finally{this._roomBusy=!1}}}_roomSection(){const e=this._roomPlan;return I`
      <section class="alexa-exp">
        <h2>Alexa rooms <span class="exp">experimental</span></h2>
        <p class="muted">
          Mirror your Home Assistant areas into Alexa's rooms — rename to match, clear the ghost
          rooms, and create any that are missing. Preview only for now; applying comes next.
        </p>
        ${e?!1===e.available?I`<div class="banner warn">
                Unavailable: ${e.reason??"no session"}. Needs Alexa Media Player logged in.
              </div>`:this._roomPlanBody(e.ops??[]):I`<button class="apply" ?disabled=${this._roomBusy} @click=${this._loadRoomPlan}>
              ${this._roomBusy?"Loading…":"Preview room sync"}
            </button>`}
      </section>
    `}_roomPlanBody(e){if(!e.length)return I`<p class="muted">Your Alexa rooms already match your HA areas. Nothing to do.</p>`;const t=e.filter(e=>"rename"===e.op),s=e.filter(e=>"delete"===e.op),i=e.filter(e=>"create"===e.op);return I`
      ${t.length?I`<div class="kindgroup">
            <h3>Rename to match HA <span class="count">${t.length}</span></h3>
            <div class="rows">
              ${t.map(e=>I`<div class="row">
                  <div class="info"><div class="name">${e.from} → ${e.to}</div></div>
                  <span class="tag">rename</span>
                </div>`)}
            </div>
          </div>`:V}
      ${s.length?I`<div class="kindgroup">
            <h3>Ghost rooms <span class="count">${s.length}</span></h3>
            <div class="rows">
              ${s.map(e=>I`<div class="row ${e.suggested?"removing":""}">
                  ${e.suggested?I`<span class="minus">−</span>`:V}
                  <div class="info">
                    <div class="name">${e.name}</div>
                    <div class="meta">${e.empty?"empty — no HA area":"has devices — kept by default"}</div>
                  </div>
                  <span class="tag ${e.suggested?"remove":""}">${e.suggested?"delete":"keep"}</span>
                </div>`)}
            </div>
          </div>`:V}
      ${i.length?I`<div class="kindgroup">
            <h3>Missing rooms (opt-in) <span class="count">${i.length}</span></h3>
            <div class="rows">
              ${i.map(e=>I`<div class="row">
                  <span class="plus">+</span>
                  <div class="info"><div class="name">${e.name}</div></div>
                  <span class="tag">create</span>
                </div>`)}
            </div>
          </div>`:V}
    `}_alexaSection(){const e=this._alexa;if(!e)return I`
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
      `;if(!1===e.available)return I`
        <section class="alexa-exp">
          <h2>Alexa devices <span class="exp">experimental</span></h2>
          <div class="banner warn">
            Unavailable: ${e.reason??"no session"}. Install and log into Alexa Media Player.
          </div>
        </section>
      `;const t=e.devices??[],s=t.filter(e=>this._alexaRemove.has(e.id)),i=t.filter(e=>!e.protected&&!this._alexaRemove.has(e.id)),o=t.filter(e=>e.protected);return I`
      <section class="alexa-exp">
        <h2>Alexa devices <span class="exp">experimental</span></h2>
        <p class="muted">
          Toggle each device <b>Keep</b> or <b>Remove</b>. The removal suggestions are generic
          (companion-app entries and duplicate names) — you decide. Protected devices, and your
          Alexa Media Player session, can't be removed.
        </p>
        ${s.length?this._deviceGroup("Removing",s,"remove"):V}
        ${i.length?this._deviceGroup("Keeping",i,"keep"):V}
        ${o.length?this._deviceGroup("Protected",o,"protected"):V}
      </section>
    `}_deviceGroup(e,t,s){return I`
      <div class="kindgroup">
        <h3>${e} <span class="count">${t.length}</span></h3>
        <div class="rows">
          ${t.map(e=>I`
              <div class="row ${"remove"===s?"removing":""}">
                ${"remove"===s?I`<span class="minus">−</span>`:V}
                <div class="info"><div class="name">${e.name}</div></div>
                ${"protected"===s?I`<span class="tag">protected</span>`:I`<button
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
    `}_deltaBar(){const e=this._summary,t=this._alexaRemove.size,s=this._busy||this._alexaBusy;return I`
      <div class="deltabar ${s?"busy":""}">
        <div class="flare"></div>
        <div class="deltabar-inner">
          <div class="chips">
            <span class="chip add" ?hidden=${!e.expose}>+${e.expose} expose</span>
            <span class="chip live" ?hidden=${!e.live_remove}>−${e.live_remove} unexpose</span>
            <span class="chip ghost" ?hidden=${!e.ghost_remove}>−${e.ghost_remove} stale</span>
            <span class="chip live" ?hidden=${!t}>−${t} device${1===t?"":"s"}</span>
          </div>
          <div class="applybtns">
            <button class="link" @click=${()=>this._detailsOpen=!this._detailsOpen}>
              ${this._detailsOpen?"Hide":"Details"}
            </button>
            <button class="apply" ?disabled=${s} @click=${this._applyAll}>
              ${s?"Applying…":"Apply all"}
            </button>
          </div>
        </div>
        ${this._detailsOpen?this._deltaDetails():V}
      </div>
    `}_deltaDetails(){const e=this._rows.filter(e=>e.desired!==e.exposed),t=(this._alexa?.devices??[]).filter(e=>this._alexaRemove.has(e.id)).map(e=>e.name).sort();return I`
      <div class="deltadetails">
        ${e.map(e=>I`<div class="dline">
            <span class="${e.desired?"plus":"minus"}">${e.desired?"+":"−"}</span>
            ${e.desired?"expose":"unexpose"} · ${e.name}
          </div>`)}
        ${this._ghosts.map(e=>I`<div class="dline"><span class="minus">−</span> clean stale · ${e.entity_id}</div>`)}
        ${t.map(e=>I`<div class="dline"><span class="minus">−</span> remove device · ${e}</div>`)}
        ${e.length||this._ghosts.length||t.length?V:I`<div class="dline muted">No pending changes.</div>`}
      </div>
    `}_row(e){const t=e.desired!==e.exposed;return I`
      <div class="row">
        <div class="info">
          <div class="name">
            ${e.name}
            ${t?I`<span class="dot" title="pending"></span>`:V}
          </div>
          <div class="meta">
            <span class="kind">${he[e.domain]??e.domain}</span>
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
    `}_ghostSection(){return I`
      <section class="ghosts">
        <h2>Stale records <span class="count">${this._ghosts.length}</span></h2>
        <p class="muted">
          Exposed to Alexa but no longer in Home Assistant (Sonos re-discovery churn). Apply
          cleans these — it can't break anything, the devices are already gone.
        </p>
        <div class="rows">
          ${this._ghosts.map(e=>I`<div class="row ghost">
              <div class="info">
                <div class="name">${e.entity_id}</div>
                <div class="meta"><span class="reason">${e.reason}</span></div>
              </div>
              <span class="tag">will clean</span>
            </div>`)}
        </div>
      </section>
    `}};ve.styles=((e,...t)=>{const s=1===e.length?e[0]:t.reduce((t,s,i)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+e[i+1],e[0]);return new r(s,e,i)})`
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
    .deltabar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 20;
      overflow: hidden;
      background: var(--card-background-color, #fff);
      border-top: 1px solid var(--divider-color, #ddd);
      box-shadow: 0 -3px 14px rgba(0, 0, 0, 0.14);
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
      justify-content: space-between;
      gap: 16px;
      max-width: 900px;
      margin: 0 auto;
      padding: 12px 16px;
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
      max-width: 900px;
      margin: 0 auto;
      max-height: 42vh;
      overflow-y: auto;
      padding: 4px 16px 12px;
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
  `,e([de({attribute:!1})],ve.prototype,"hass",void 0),e([de({attribute:!1})],ve.prototype,"narrow",void 0),e([pe()],ve.prototype,"_rows",void 0),e([pe()],ve.prototype,"_summary",void 0),e([pe()],ve.prototype,"_loading",void 0),e([pe()],ve.prototype,"_busy",void 0),e([pe()],ve.prototype,"_held",void 0),e([pe()],ve.prototype,"_unavailable",void 0),e([pe()],ve.prototype,"_alexa",void 0),e([pe()],ve.prototype,"_alexaBusy",void 0),e([pe()],ve.prototype,"_alexaRemove",void 0),e([pe()],ve.prototype,"_detailsOpen",void 0),e([pe()],ve.prototype,"_roomPlan",void 0),e([pe()],ve.prototype,"_roomBusy",void 0),ve=e([(e=>(t,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)})("alexa-panel")],ve);export{ve as AlexaPanel};
