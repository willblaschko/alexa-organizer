function e(e,t,o,r){var i,n=arguments.length,s=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,o):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)s=Reflect.decorate(e,t,o,r);else for(var a=e.length-1;a>=0;a--)(i=e[a])&&(s=(n<3?i(s):n>3?i(t,o,s):i(t,o))||s);return n>3&&s&&Object.defineProperty(t,o,s),s}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,o=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,r=Symbol(),i=new WeakMap;let n=class{constructor(e,t,o){if(this._$cssResult$=!0,o!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(o&&void 0===e){const o=void 0!==t&&1===t.length;o&&(e=i.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&i.set(t,e))}return e}toString(){return this.cssText}};const s=o?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const o of e.cssRules)t+=o.cssText;return(e=>new n("string"==typeof e?e:e+"",void 0,r))(t)})(e):e,{is:a,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:p,getOwnPropertySymbols:l,getPrototypeOf:h}=Object,u=globalThis,m=u.trustedTypes,f=m?m.emptyScript:"",g=u.reactiveElementPolyfillSupport,v=(e,t)=>e,_={toAttribute(e,t){switch(t){case Boolean:e=e?f:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let o=e;switch(t){case Boolean:o=null!==e;break;case Number:o=null===e?null:Number(e);break;case Object:case Array:try{o=JSON.parse(e)}catch(e){o=null}}return o}},x=(e,t)=>!a(e,t),b={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:x};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let y=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const o=Symbol(),r=this.getPropertyDescriptor(e,o,t);void 0!==r&&d(this.prototype,e,r)}}static getPropertyDescriptor(e,t,o){const{get:r,set:i}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){const n=r?.call(this);i?.call(this,t),this.requestUpdate(e,n,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const e=h(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const e=this.properties,t=[...p(e),...l(e)];for(const o of t)this.createProperty(o,e[o])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,o]of t)this.elementProperties.set(e,o)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const o=this._$Eu(e,t);void 0!==o&&this._$Eh.set(o,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const o=new Set(e.flat(1/0).reverse());for(const e of o)t.unshift(s(e))}else void 0!==e&&t.push(s(e));return t}static _$Eu(e,t){const o=t.attribute;return!1===o?void 0:"string"==typeof o?o:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const o of t.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,r)=>{if(o)e.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const o of r){const r=document.createElement("style"),i=t.litNonce;void 0!==i&&r.setAttribute("nonce",i),r.textContent=o.cssText,e.appendChild(r)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,o){this._$AK(e,o)}_$ET(e,t){const o=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,o);if(void 0!==r&&!0===o.reflect){const i=(void 0!==o.converter?.toAttribute?o.converter:_).toAttribute(t,o.type);this._$Em=e,null==i?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){const o=this.constructor,r=o._$Eh.get(e);if(void 0!==r&&this._$Em!==r){const e=o.getPropertyOptions(r),i="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:_;this._$Em=r;const n=i.fromAttribute(t,e.type);this[r]=n??this._$Ej?.get(r)??n,this._$Em=null}}requestUpdate(e,t,o,r=!1,i){if(void 0!==e){const n=this.constructor;if(!1===r&&(i=this[e]),o??=n.getPropertyOptions(e),!((o.hasChanged??x)(i,t)||o.useDefault&&o.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,o))))return;this.C(e,t,o)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:o,reflect:r,wrapped:i},n){o&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==i||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||o||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,o]of e){const{wrapped:e}=o,r=this[t];!0!==e||this._$AL.has(t)||void 0===r||this.C(t,void 0,o,r)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[v("elementProperties")]=new Map,y[v("finalized")]=new Map,g?.({ReactiveElement:y}),(u.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,$=e=>e,k=w.trustedTypes,A=k?k.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+E,P=`<${C}>`,M=document,z=()=>M.createComment(""),O=e=>null===e||"object"!=typeof e&&"function"!=typeof e,R=Array.isArray,H="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,N=/>/g,j=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),D=/'/g,L=/"/g,B=/^(?:script|style|textarea|title)$/i,G=(e=>(t,...o)=>({_$litType$:e,strings:t,values:o}))(1),I=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),V=new WeakMap,q=M.createTreeWalker(M,129);function J(e,t){if(!R(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(t):t}const F=(e,t)=>{const o=e.length-1,r=[];let i,n=2===t?"<svg>":3===t?"<math>":"",s=U;for(let t=0;t<o;t++){const o=e[t];let a,d,c=-1,p=0;for(;p<o.length&&(s.lastIndex=p,d=s.exec(o),null!==d);)p=s.lastIndex,s===U?"!--"===d[1]?s=T:void 0!==d[1]?s=N:void 0!==d[2]?(B.test(d[2])&&(i=RegExp("</"+d[2],"g")),s=j):void 0!==d[3]&&(s=j):s===j?">"===d[0]?(s=i??U,c=-1):void 0===d[1]?c=-2:(c=s.lastIndex-d[2].length,a=d[1],s=void 0===d[3]?j:'"'===d[3]?L:D):s===L||s===D?s=j:s===T||s===N?s=U:(s=j,i=void 0);const l=s===j&&e[t+1].startsWith("/>")?" ":"";n+=s===U?o+P:c>=0?(r.push(a),o.slice(0,c)+S+o.slice(c)+E+l):o+E+(-2===c?t:l)}return[J(e,n+(e[o]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),r]};class K{constructor({strings:e,_$litType$:t},o){let r;this.parts=[];let i=0,n=0;const s=e.length-1,a=this.parts,[d,c]=F(e,t);if(this.el=K.createElement(d,o),q.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(r=q.nextNode())&&a.length<s;){if(1===r.nodeType){if(r.hasAttributes())for(const e of r.getAttributeNames())if(e.endsWith(S)){const t=c[n++],o=r.getAttribute(e).split(E),s=/([.?@])?(.*)/.exec(t);a.push({type:1,index:i,name:s[2],strings:o,ctor:"."===s[1]?ee:"?"===s[1]?te:"@"===s[1]?oe:Y}),r.removeAttribute(e)}else e.startsWith(E)&&(a.push({type:6,index:i}),r.removeAttribute(e));if(B.test(r.tagName)){const e=r.textContent.split(E),t=e.length-1;if(t>0){r.textContent=k?k.emptyScript:"";for(let o=0;o<t;o++)r.append(e[o],z()),q.nextNode(),a.push({type:2,index:++i});r.append(e[t],z())}}}else if(8===r.nodeType)if(r.data===C)a.push({type:2,index:i});else{let e=-1;for(;-1!==(e=r.data.indexOf(E,e+1));)a.push({type:7,index:i}),e+=E.length-1}i++}}static createElement(e,t){const o=M.createElement("template");return o.innerHTML=e,o}}function Z(e,t,o=e,r){if(t===I)return t;let i=void 0!==r?o._$Co?.[r]:o._$Cl;const n=O(t)?void 0:t._$litDirective$;return i?.constructor!==n&&(i?._$AO?.(!1),void 0===n?i=void 0:(i=new n(e),i._$AT(e,o,r)),void 0!==r?(o._$Co??=[])[r]=i:o._$Cl=i),void 0!==i&&(t=Z(e,i._$AS(e,t.values),i,r)),t}class X{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:o}=this._$AD,r=(e?.creationScope??M).importNode(t,!0);q.currentNode=r;let i=q.nextNode(),n=0,s=0,a=o[0];for(;void 0!==a;){if(n===a.index){let t;2===a.type?t=new Q(i,i.nextSibling,this,e):1===a.type?t=new a.ctor(i,a.name,a.strings,this,e):6===a.type&&(t=new re(i,this,e)),this._$AV.push(t),a=o[++s]}n!==a?.index&&(i=q.nextNode(),n++)}return q.currentNode=M,r}p(e){let t=0;for(const o of this._$AV)void 0!==o&&(void 0!==o.strings?(o._$AI(e,o,t),t+=o.strings.length-2):o._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,o,r){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=o,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),O(e)?e===W||null==e||""===e?(this._$AH!==W&&this._$AR(),this._$AH=W):e!==this._$AH&&e!==I&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>R(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==W&&O(this._$AH)?this._$AA.nextSibling.data=e:this.T(M.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:o}=e,r="number"==typeof o?this._$AC(e):(void 0===o.el&&(o.el=K.createElement(J(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===r)this._$AH.p(t);else{const e=new X(r,this),o=e.u(this.options);e.p(t),this.T(o),this._$AH=e}}_$AC(e){let t=V.get(e.strings);return void 0===t&&V.set(e.strings,t=new K(e)),t}k(e){R(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let o,r=0;for(const i of e)r===t.length?t.push(o=new Q(this.O(z()),this.O(z()),this,this.options)):o=t[r],o._$AI(i),r++;r<t.length&&(this._$AR(o&&o._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=$(e).nextSibling;$(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Y{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,o,r,i){this.type=1,this._$AH=W,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,o.length>2||""!==o[0]||""!==o[1]?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=W}_$AI(e,t=this,o,r){const i=this.strings;let n=!1;if(void 0===i)e=Z(this,e,t,0),n=!O(e)||e!==this._$AH&&e!==I,n&&(this._$AH=e);else{const r=e;let s,a;for(e=i[0],s=0;s<i.length-1;s++)a=Z(this,r[o+s],t,s),a===I&&(a=this._$AH[s]),n||=!O(a)||a!==this._$AH[s],a===W?e=W:e!==W&&(e+=(a??"")+i[s+1]),this._$AH[s]=a}n&&!r&&this.j(e)}j(e){e===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends Y{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===W?void 0:e}}class te extends Y{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==W)}}class oe extends Y{constructor(e,t,o,r,i){super(e,t,o,r,i),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??W)===I)return;const o=this._$AH,r=e===W&&o!==W||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,i=e!==W&&(o===W||r);r&&this.element.removeEventListener(this.name,this,o),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class re{constructor(e,t,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}}const ie=w.litHtmlPolyfillSupport;ie?.(K,Q),(w.litHtmlVersions??=[]).push("3.3.3");const ne=globalThis;class se extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,o)=>{const r=o?.renderBefore??t;let i=r._$litPart$;if(void 0===i){const e=o?.renderBefore??null;r._$litPart$=i=new Q(t.insertBefore(z(),e),e,void 0,o??{})}return i._$AI(e),i})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return I}}se._$litElement$=!0,se.finalized=!0,ne.litElementHydrateSupport?.({LitElement:se});const ae=ne.litElementPolyfillSupport;ae?.({LitElement:se}),(ne.litElementVersions??=[]).push("4.2.2");const de={attribute:!0,type:String,converter:_,reflect:!1,hasChanged:x},ce=(e=de,t,o)=>{const{kind:r,metadata:i}=o;let n=globalThis.litPropertyMetadata.get(i);if(void 0===n&&globalThis.litPropertyMetadata.set(i,n=new Map),"setter"===r&&((e=Object.create(e)).wrapped=!0),n.set(o.name,e),"accessor"===r){const{name:r}=o;return{set(o){const i=t.get.call(this);t.set.call(this,o),this.requestUpdate(r,i,e,!0,o)},init(t){return void 0!==t&&this.C(r,void 0,e,t),t}}}if("setter"===r){const{name:r}=o;return function(o){const i=this[r];t.call(this,o),this.requestUpdate(r,i,e,!0,o)}}throw Error("Unsupported decorator location: "+r)};function pe(e){return(t,o)=>"object"==typeof o?ce(e,t,o):((e,t,o)=>{const r=t.hasOwnProperty(o);return t.constructor.createProperty(o,e),r?Object.getOwnPropertyDescriptor(t,o):void 0})(e,t,o)}function le(e){return pe({...e,state:!0,attribute:!1})}const he=["expose","create_room","rename_room","place","preferred","remove","delete_room"];function ue(e){const t=e.action;switch(t.kind){case"expose":return"expose";case"room_op":return"create"===t.op?"create_room":"rename"===t.op?"rename_room":"delete_room";case"move":case"move_to_area":return"place";case"preferred":return"preferred";case"remove_device":case"remove_endpoint":return"remove"}}const me={media_player:"Speaker",light:"Light",switch:"Switch",climate:"Climate",scene:"Scene",script:"Script",cover:"Cover",fan:"Fan",vacuum:"Vacuum",lock:"Lock",camera:"Camera",input_boolean:"Toggle"},fe=[{label:"Lighting",domains:["light","switch"]},{label:"Speakers",domains:["media_player"]},{label:"Climate",domains:["climate","fan"]},{label:"Scenes & routines",domains:["scene","script"]},{label:"Other",domains:["cover","vacuum","lock","camera","input_boolean"]}],ge={};fe.forEach((e,t)=>e.domains.forEach(e=>ge[e]=t));const ve=e=>ge[e]??fe.length-1;let _e=class extends se{constructor(){super(...arguments),this.narrow=!1,this._plan=null,this._planBusy=!1,this._accepted=new Set,this._reviewOpen=!1,this._opStatus={},this._applying=!1,this._userMove={},this._expandedGroups=new Set}connectedCallback(){super.connectedCallback(),this._loadPlan()}render(){return G`
      <div class="wrap">
        <header>
          <div class="titles">
            <h1>Alexa Organizer</h1>
            <p class="sub">Home Assistant is your house. This keeps Alexa matched to it.</p>
          </div>
        </header>
        ${this._planView()}
      </div>
    `}async _loadPlan(){if(!this._planBusy){this._planBusy=!0;try{const e=await this.hass.connection.sendMessagePromise({type:"alexa_organizer/plan"});this._plan=e,this._accepted=new Set((e.groups??[]).flatMap(e=>e.ops).filter(e=>e.suggested).map(e=>e.id)),this._opStatus={},this._userMove={}}finally{this._planBusy=!1}}}_toggleOp(e){const t=new Set(this._accepted);t.has(e)?t.delete(e):t.add(e),this._accepted=t}get _acceptedCount(){const e=new Set(this._effectiveGroups().flatMap(e=>e.ops).map(e=>e.id));let t=0;for(const o of this._accepted)e.has(o)&&t++;return t}_endpointCurrentRoom(){const e=new Map,t=this._plan?.board;for(const o of t?.rooms??[])for(const t of o.devices)t.endpoint_id&&e.set(t.endpoint_id,o.id??"");for(const o of t?.unroomed??[])o.endpoint_id&&e.set(o.endpoint_id,"");return e}_deviceName(e){const t=this._plan?.board;for(const o of[...(t?.rooms??[]).flatMap(e=>e.devices),...t?.unroomed??[]])if(o.endpoint_id===e)return o.name;return e}_norm(e){return(e||"").trim().toLowerCase()}_areaHasRoom(e){return(this._plan?.board.rooms??[]).some(t=>!!t.id&&this._norm(t.name)===this._norm(e))}_effectiveGroups(){const e=this._plan?.groups??[],t=Object.keys(this._userMove);if(0===t.length)return e;const o=this._endpointCurrentRoom(),r=[],i=[];for(const[e,t]of Object.entries(this._userMove)){const n=o.get(e)??"";if(t!==n)if(t.startsWith("#area#")){const o=t.slice(6);r.push({id:`move:${e}`,group:"place",title:`Put ${this._deviceName(e)} in ${o}`,detail:this._areaHasRoom(o)?"":"creates the room",suggested:!0,destructive:!1,action:{kind:"move",endpoint_id:e,from:n||null,to:"",area:o}}),this._areaHasRoom(o)||i.some(e=>e.id===`room:create:${o}`)||i.push({id:`room:create:${o}`,group:"rooms",title:`Create room ${o}`,detail:"for its devices",suggested:!0,destructive:!1,action:{kind:"room_op",op:"create",name:o}})}else r.push({id:`move:${e}`,group:"place",title:`Move ${this._deviceName(e)}`,detail:"",suggested:!0,destructive:!1,action:{kind:"move",endpoint_id:e,from:n||null,to:t}})}const n=new Set(t),s=new Set(e.flatMap(e=>e.ops).map(e=>e.id)),a=i.filter(e=>!s.has(e.id));let d=!1;const c=e.map(e=>"rooms"===e.key?{...e,ops:[...e.ops,...a]}:"place"!==e.key?e:(d=!0,{...e,ops:[...e.ops.filter(e=>!(e=>"move"===e.action.kind&&!!e.action.endpoint_id&&n.has(e.action.endpoint_id))(e)),...r]}));return!e.some(e=>"rooms"===e.key)&&a.length&&c.unshift({key:"rooms",title:"Rooms",destructive:!1,ops:a}),!d&&r.length&&c.push({key:"place",title:"Put devices in their room",destructive:!1,ops:r}),c}_homeRooms(){return(this._plan?.board.rooms??[]).filter(e=>e.id||e.in_ha).map(e=>({value:e.id||`#area#${e.name}`,name:e.name}))}_onHomeMove(e,t){const o=this._endpointCurrentRoom().get(e)??"";this._userMove={...this._userMove,[e]:t};const r=new Set(this._accepted),i=`move:${e}`;if(t===o?r.delete(i):r.add(i),t.startsWith("#area#")){const e=t.slice(6);this._areaHasRoom(e)||r.add(`room:create:${e}`)}this._accepted=r}_planEndpointCount(){const e=this._plan?.board.rooms??[],t=this._plan?.board.unroomed??[];return e.reduce((e,t)=>e+t.devices.filter(e=>e.endpoint_id).length,0)+t.filter(e=>e.endpoint_id).length}async _applyPlan(){if(this._applying||!this._plan)return;this._applying=!0;const e=this._plan,t=e=>(e||"").trim().toLowerCase(),o=(e,t)=>this.hass.callService("alexa_organizer",e,t),r=e=>this.hass.connection.sendMessagePromise(e),i=(e,t)=>this._opStatus={...this._opStatus,[e]:t},n=async(e,t)=>{i(e,"running");try{await t(),i(e,"done")}catch{i(e,"error")}};try{const s=this._effectiveGroups().flatMap(e=>e.ops).filter(e=>this._accepted.has(e.id)),a=s.some(e=>"expose"===e.action.kind&&!0===e.action.to),d=new Map;for(const o of e.board.rooms??[])o.id&&d.set(t(o.name),o.id);for(const{lane:a,ops:c}of function(e){const t=new Map;for(const o of e){const e=ue(o),r=t.get(e);r?r.push(o):t.set(e,[o])}return he.filter(e=>t.has(e)).map(e=>({lane:e,ops:t.get(e)}))}(s))if("expose"===a){const t=e.groups.flatMap(e=>e.ops).filter(e=>"expose"===e.action.kind);for(const e of t.filter(e=>!this._accepted.has(e.id)))await r({type:"alexa_organizer/set",entity_id:e.action.entity_id,expose:!e.action.to});c.forEach(e=>i(e.id,"running"));try{await r({type:"alexa_organizer/apply",force:!0}),c.forEach(e=>i(e.id,"done"))}catch{c.forEach(e=>i(e.id,"error"))}}else if("create_room"===a)await Promise.all(c.map(e=>n(e.id,async()=>{const o=await r({type:"alexa_organizer/create_room",name:e.action.name});if(!o.ok||!o.id)throw new Error(o.reason||"create failed");d.set(t(e.action.name),o.id)})));else if("rename_room"===a)await Promise.all(c.map(e=>n(e.id,()=>o("room_op",{action:"rename",id:e.action.id,name:e.action.name}))));else if("place"===a)await Promise.all(c.map(e=>n(e.id,()=>{const r=e.action;let i=r.to||"";if(!i&&r.area&&(i=d.get(t(r.area))??"",!i))throw new Error("room not created");const n={endpoint_id:r.endpoint_id};return r.from&&(n.from=r.from),i&&(n.to=i),o("move_device",n)})));else if("preferred"===a)await Promise.all(c.map(e=>n(e.id,()=>o("set_preferred_speaker",{room_id:e.action.room_id,endpoint_id:e.action.endpoint_id}))));else if("remove"===a){const e=c.filter(e=>"remove_device"===e.action.kind),t=c.filter(e=>"remove_endpoint"===e.action.kind);if(e.length){e.forEach(e=>i(e.id,"running"));try{await o("alexa_devices",{apply:!0,endpoint_ids:e.map(e=>e.action.endpoint_id)}),e.forEach(e=>i(e.id,"done"))}catch{e.forEach(e=>i(e.id,"error"))}}await Promise.all(t.map(e=>n(e.id,()=>o("forget_endpoint",{endpoint_id:e.action.endpoint_id}))))}else"delete_room"===a&&await Promise.all(c.map(e=>n(e.id,()=>o("room_op",{action:"delete",id:e.action.id}))));if(a){const e=this._planEndpointCount();for(let t=0;t<12&&(await new Promise(e=>setTimeout(e,4e3)),await this._loadPlan(),!(this._planEndpointCount()>e));t++);}else await this._loadPlan();this._reviewOpen=!1}finally{this._applying=!1}}_planView(){const e=this._plan;return e?G`
      ${this._hero()}
      ${this._reviewOpen?this._reviewSheet():W}
      ${e.available?W:G`<div class="banner warn">
            Connect Alexa to organize rooms &amp; devices — this needs the Alexa Media Player or
            Alexa Devices integration signed in. Showing Home Assistant exposure only for now.
          </div>`}
      ${this._planBoard()}
    `:G`<p class="muted">Computing your plan…</p>`}_hero(){const e=this._plan,t=this._acceptedCount;return e.available&&0===t?G`<div class="hero ok"><span class="tick">✓</span> Alexa matches your house</div>`:G`
      <div class="hero">
        <div class="herotext">
          <strong>${t}</strong> change${1===t?"":"s"} to make Alexa match your house
        </div>
        <button class="apply" ?disabled=${this._applying||0===t} @click=${()=>this._reviewOpen=!0}>
          ${this._applying?"Syncing…":"Review & Sync"}
        </button>
      </div>
    `}_reviewSheet(){const e=this._acceptedCount;return G`
      <div class="reviewsheet">
        <div class="reviewhead">
          <h2>Review changes</h2>
          <button class="link" ?disabled=${this._applying} @click=${()=>this._reviewOpen=!1}>Close</button>
        </div>
        ${this._effectiveGroups().map(e=>this._reviewGroup(e))}
        <div class="reviewfoot">
          <button class="apply" ?disabled=${this._applying||0===e} @click=${this._applyPlan}>
            ${this._applying?"Syncing…":`Sync ${e} change${1===e?"":"s"}`}
          </button>
        </div>
      </div>
    `}_toggleGroupExpand(e){const t=new Set(this._expandedGroups);t.has(e)?t.delete(e):t.add(e),this._expandedGroups=t}_toggleGroup(e,t){const o=new Set(this._accepted);for(const r of e.ops)t?o.add(r.id):o.delete(r.id);this._accepted=o}_reviewGroup(e){const t=e.ops.length,o=e.ops.filter(e=>this._accepted.has(e.id)).length,r=this._expandedGroups.has(e.key);return G`
      <div class="reviewgroup ${e.destructive?"danger":""}">
        <div class="grouphead">
          <input
            type="checkbox"
            .checked=${o===t&&t>0}
            .indeterminate=${o>0&&o<t}
            ?disabled=${this._applying}
            @change=${t=>this._toggleGroup(e,t.target.checked)}
          />
          <button class="grouptitle" @click=${()=>this._toggleGroupExpand(e.key)}>
            <span class="chev ${r?"open":""}">▸</span>
            ${e.title}
            <span class="gcount">${o}${o!==t?` of ${t}`:""}</span>
          </button>
        </div>
        ${r?G`<div class="groupbody">
              ${e.ops.map(e=>G`
                  <label class="reviewop">
                    ${this._statusDisc(this._opStatus[e.id])}
                    <input
                      type="checkbox"
                      .checked=${this._accepted.has(e.id)}
                      ?disabled=${this._applying}
                      @change=${()=>this._toggleOp(e.id)}
                    />
                    <span class="optitle">${e.title}</span>
                    ${e.detail?G`<span class="opdetail">${e.detail}</span>`:W}
                  </label>
                `)}
            </div>`:W}
      </div>
    `}_planBoard(){const e=function(e,t,o){const r=e=>(e||"").trim().toLowerCase(),i={},n={},s=new Set,a=new Map,d=new Set;for(const e of t)for(const t of e.ops){if(!o.has(t.id))continue;const e=t.action;"move"!==e.kind&&"move_to_area"!==e.kind||!e.endpoint_id?"remove_device"!==e.kind&&"remove_endpoint"!==e.kind||!e.endpoint_id?"expose"===e.kind&&e.entity_id?a.set(e.entity_id,e.to):"room_op"===e.kind&&"create"===e.op&&e.name&&d.add(r(e.name)):s.add(e.endpoint_id):"move"===e.kind&&e.to?i[e.endpoint_id]=e.to:e.area?n[e.endpoint_id]=r(e.area):i[e.endpoint_id]=""}const c=function(e,t,o){const r=e=>!!e.endpoint_id&&e.endpoint_id in o,i=e=>o[e.endpoint_id],n=[...e.flatMap(e=>e.devices),...t].filter(r),s=e.map(e=>{const t=e.devices.filter(t=>!r(t)||i(t)===e.id),o=n.filter(t=>i(t)===e.id&&!e.devices.includes(t));return{...e,devices:[...t,...o]}}),a=[...t.filter(e=>!r(e)||""===i(e)),...n.filter(e=>""===i(e)&&!t.includes(e))];return{rooms:s,unroomed:a}}(e.rooms??[],e.unroomed??[],i),p=new Map(c.rooms.map(e=>[r(e.name),e])),l=e=>{for(const t of c.rooms){const o=t.devices.findIndex(t=>t.endpoint_id===e);if(o>=0)return t.devices.splice(o,1)[0]}const t=c.unroomed.findIndex(t=>t.endpoint_id===e);return t>=0?c.unroomed.splice(t,1)[0]:void 0};for(const[e,t]of Object.entries(n)){const o=l(e);if(!o)continue;const r=p.get(t);r?r.devices.push(o):c.unroomed.push(o)}const h=e=>({...e,_removing:!!e.endpoint_id&&s.has(e.endpoint_id),exposed:e.entity_id&&a.has(e.entity_id)?a.get(e.entity_id):e.exposed});return{rooms:c.rooms.map(e=>({...e,_creating:e._creating||d.has(r(e.name)),devices:e.devices.map(h)})),unroomed:c.unroomed.map(h)}}(this._plan.board,this._effectiveGroups(),this._accepted);return G`
      ${e.rooms.map(e=>this._previewRoom(e))}
      ${e.unroomed.length?this._previewRoom({id:null,name:"No room",in_alexa:!1,in_ha:!1,preferred_id:null,devices:e.unroomed}):W}
    `}_previewRoom(e){return G`
      <section class="room card">
        <h2 class="rhead">${e.name} <span class="count">${e.devices.length}</span></h2>
        <div class="kindgrid">
          ${this._boardBuckets(e.devices).map(t=>G`
              <div class="kindgroup group kind-${t.kind}">
                <h3 class="gcap">${t.label}</h3>
                <div class="rows">${t.devices.map(t=>this._previewDeviceRow(t,e))}</div>
              </div>
            `)}
        </div>
      </section>
    `}_previewDeviceRow(e,t){const o="ha"===e.source?`HA · ${me[e.domain??""]??e.domain??"HA"}`:"echo"===e.source?"Echo":"Alexa-only",r=!(!t.preferred_id||e.endpoint_id!==t.preferred_id),i=t.id??(t.in_ha?`#area#${t.name}`:"");return G`
      <div class="row ${e._removing?"removing":""}">
        <div class="info">
          <div class="name ${e._removing?"strike":""}">${e.name}</div>
          <div class="meta">
            <span class="kind">${o}</span>
            ${r?G`<span class="pill">plays music here</span>`:W}
            ${"ha"===e.source&&!1===e.exposed?G`<span class="reason">hidden</span>`:W}
            ${e.synced?W:G`<span class="reason">will sync to Alexa</span>`}
            ${e._removing?G`<span class="reason danger">will be removed</span>`:W}
          </div>
        </div>
        ${e.endpoint_id&&!e._removing?G`<select
              class="roomsel"
              ?disabled=${this._applying}
              @change=${t=>this._onHomeMove(e.endpoint_id,t.target.value)}
            >
              <option value="" ?selected=${""===i}>(no room)</option>
              ${this._homeRooms().map(e=>G`<option value=${e.value} ?selected=${i===e.value}>${e.name}</option>`)}
            </select>`:W}
      </div>
    `}_boardBuckets(e){const t=new Map;for(const o of e){let e,r,i,n;if("echo"===o.source)[e,r,i,n]=["echo","Echo","echo",90];else if("alexa"===o.source)[e,r,i,n]=["alexa","Alexa-only","alexa",91];else{const t=o.domain?ve(o.domain):fe.length-1;[e,r,i,n]=["k"+t,fe[t].label,fe[t].label.toLowerCase().split(" ")[0],t]}const s=t.get(e);s?s.devices.push(o):t.set(e,{label:r,kind:i,order:n,devices:[o]})}return[...t.values()].sort((e,t)=>e.order-t.order)}_statusDisc(e){return"done"===e?G`<span class="state done">✓</span>`:"error"===e?G`<span class="state error">✗</span>`:"running"===e?G`<span class="state running"></span>`:G`<span class="state pending"></span>`}};_e.styles=((e,...t)=>{const o=1===e.length?e[0]:t.reduce((t,o,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(o)+e[r+1],e[0]);return new n(o,e,r)})`
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
    /* A room is a Chorus-style card; its kind-groups are tinted nested boxes. */
    section.room.card {
      margin-bottom: 26px;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      padding: 12px 14px 14px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
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
    .room .rhead {
      margin: 2px 2px 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--divider-color, #ececec);
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
    /* Standalone card list (used by the cleanup / device sections). */
    .rows {
      background: var(--card-background-color, #fff);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    }
    /* Within a room, each kind is a plain grouped-list section: an uppercase header with a
       hairline, then its rows. No tinted rounded boxes / colored rails. Masonry packs the
       sections into ~260px columns (CSS multi-column) so short sections fill the height. */
    .kindgrid {
      column-width: 260px;
      column-gap: 22px;
    }
    .room .kindgroup {
      min-width: 0;
      margin: 0 0 18px;
      display: flow-root; /* own block-formatting context — no margin-clip at a column top */
      -webkit-column-break-inside: avoid;
      break-inside: avoid; /* keep a section together within a column */
    }
    .room .kindgroup .gcap {
      color: var(--secondary-text-color, #6b7280);
      margin: 0;
      padding-bottom: 5px;
      border-bottom: 1px solid var(--divider-color, #e0e0e0);
    }
    .room .kindgroup .rows {
      background: transparent;
      border-radius: 0;
      box-shadow: none;
      overflow: visible;
    }
    .room .kindgroup .row {
      /* In a narrow masonry column, let the dropdown wrap below the name instead of
         crushing it — the device name keeps a full line, the room picker drops under it. */
      flex-wrap: wrap;
      gap: 4px 10px;
      padding: 9px 2px;
    }
    .room .kindgroup .row:last-child {
      border-bottom: none;
    }
    .room .kindgroup .row .info {
      flex: 1 1 60%;
    }
    .room .kindgroup .roomsel {
      max-width: 100%;
      margin-left: auto;
    }
    /* Per-device inline controls in the board */
    .rowctl {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    /* "plays music here" — marks a room's main speaker in plain words, not a mystery star. */
    .pill {
      font-size: 0.66rem;
      font-weight: 600;
      color: var(--primary-color, #2f6fed);
    }
    .rm {
      border: 1px solid var(--divider-color, #d0d0d0);
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #999);
      border-radius: 8px;
      padding: 5px 9px;
      font-size: 12px;
      cursor: pointer;
    }
    .rm.on {
      color: #fff;
      background: var(--error-color, #d33);
      border-color: var(--error-color, #d33);
    }
    .headright {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .viewtoggle {
      display: inline-flex;
      border: 1px solid var(--divider-color, #d0d0d0);
      border-radius: 9px;
      overflow: hidden;
    }
    .viewtoggle button {
      border: none;
      background: var(--card-background-color, #fff);
      color: var(--secondary-text-color, #777);
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .viewtoggle button.on {
      background: var(--primary-color, #2f6fed);
      color: #fff;
    }
    /* Plan view: hero status + review sheet */
    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-left: 4px solid var(--primary-color, #2f6fed);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 18px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    }
    .hero.ok {
      border-left-color: var(--success-color, #2e7d32);
      color: var(--success-color, #2e7d32);
      font-weight: 600;
    }
    .hero .tick {
      font-size: 1.2rem;
      margin-right: 6px;
    }
    .hero .herotext {
      font-size: 1.05rem;
    }
    .hero .herotext strong {
      font-size: 1.35rem;
    }
    .hero .apply {
      flex-shrink: 0;
    }
    .reviewsheet {
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color, #e0e0e0);
      border-radius: 12px;
      padding: 10px 16px 16px;
      margin-bottom: 18px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
    }
    .reviewhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--divider-color, #ececec);
      padding-bottom: 8px;
      margin-bottom: 6px;
    }
    .reviewhead h2 {
      margin: 4px 0;
    }
    .reviewgroup {
      padding: 4px 0;
      border-bottom: 1px solid var(--divider-color, #f0f0f0);
    }
    .grouphead {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 2px;
    }
    .grouphead input {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
    }
    .grouptitle {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--primary-text-color, #212121);
      text-align: left;
    }
    .reviewgroup.danger .grouptitle {
      color: var(--error-color, #d33);
    }
    .chev {
      display: inline-block;
      transition: transform 0.15s ease;
      opacity: 0.6;
      font-size: 0.8rem;
    }
    .chev.open {
      transform: rotate(90deg);
    }
    .gcount {
      font-weight: 400;
      color: var(--secondary-text-color, #888);
      font-size: 0.85rem;
    }
    .groupbody {
      padding: 2px 0 6px 26px;
    }
    .reviewop {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 4px;
      cursor: pointer;
    }
    .reviewop input {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
    }
    .reviewop .optitle {
      flex: 1;
      min-width: 0;
    }
    .reviewop .opdetail {
      color: var(--secondary-text-color, #888);
      font-size: 0.82rem;
    }
    .reviewfoot {
      display: flex;
      justify-content: flex-end;
      padding-top: 12px;
    }
    .name.strike {
      text-decoration: line-through;
      opacity: 0.6;
    }
    .reason.danger {
      color: var(--error-color, #d33);
    }
    .row.removing {
      opacity: 0.7;
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
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: var(--secondary-text-color, #727272);
      margin-top: 3px;
    }
    .kind {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 1px 6px;
      border-radius: 4px;
      background: var(--divider-color, #e8e8e8);
      color: var(--secondary-text-color, #616161);
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
  `,e([pe({attribute:!1})],_e.prototype,"hass",void 0),e([pe({attribute:!1})],_e.prototype,"narrow",void 0),e([le()],_e.prototype,"_plan",void 0),e([le()],_e.prototype,"_planBusy",void 0),e([le()],_e.prototype,"_accepted",void 0),e([le()],_e.prototype,"_reviewOpen",void 0),e([le()],_e.prototype,"_opStatus",void 0),e([le()],_e.prototype,"_applying",void 0),e([le()],_e.prototype,"_userMove",void 0),e([le()],_e.prototype,"_expandedGroups",void 0),_e=e([(e=>(t,o)=>{void 0!==o?o.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)})("alexa-panel")],_e);export{_e as AlexaPanel};
