import{x as i,T as g,i as C,n as h,s as y,o as z,a as m,t as w,r as f,e as L,b as v,c as S}from"./vendor-9AMKf4B_.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function o(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(s){if(s.ep)return;s.ep=!0;const a=o(s);fetch(s.href,a)}})();const $="";async function T(t){const e=t.apiUrl||$,o=await fetch(`${e}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:t.messages,stream:t.stream,context:{top:t.top,temperature:t.temperature}})});if(t.stream)return O(o,t.chunkIntervalMs);const r=await o.json();if(o.status>299||!o.ok)throw new Error(r.error||"Unknown error");return r}function P(t){return`${$}/content/${t}`}class M extends TransformStream{constructor(){let e;super({start:o=>{e=o},transform:o=>{const r=o.split(`
`).filter(Boolean);for(const s of r)try{this.buffer+=s,e.enqueue(JSON.parse(this.buffer)),this.buffer=""}catch{}}}),this.buffer=""}}async function*O(t,e){var a;const o=(a=t.body)==null?void 0:a.pipeThrough(new TextDecoderStream).pipeThrough(new M).getReader();if(!o)throw new Error("No response body or body is not readable");let r,s;for(;{value:r,done:s}=await o.read(),!s;)yield new Promise(n=>{setTimeout(()=>{n(r)},e)})}function E(t,e){if(t.role==="user")return{html:i`${t.content}`,citations:[],followupQuestions:[],role:t.role,context:t.context};const o=[],r=[],a=t.content.replaceAll(/<<([^>]+)>>/g,(l,d)=>(r.push(d),"")).split("<<")[0].trim().split(/\[([^\]]+)]/g);return{html:i`${a.map((l,d)=>{if(d%2===0)return i`${l}`;if(d+1<a.length){let b=o.indexOf(l);return b===-1?(o.push(l),b=o.length):b++,e(l,b)}else return g})}`,citations:o,followupQuestions:r,role:t.role,context:t.context}}const _='<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5.69362 11.9997L2.29933 3.2715C2.0631 2.66403 2.65544 2.08309 3.2414 2.28959L3.33375 2.32885L21.3337 11.3288C21.852 11.588 21.8844 12.2975 21.4309 12.6129L21.3337 12.6705L3.33375 21.6705C2.75077 21.962 2.11746 21.426 2.2688 20.8234L2.29933 20.7278L5.69362 11.9997L2.29933 3.2715L5.69362 11.9997ZM4.4021 4.54007L7.01109 11.2491L13.6387 11.2497C14.0184 11.2497 14.3322 11.5318 14.3818 11.8979L14.3887 11.9997C14.3887 12.3794 14.1065 12.6932 13.7404 12.7428L13.6387 12.7497L7.01109 12.7491L4.4021 19.4593L19.3213 11.9997L4.4021 4.54007Z"></path></svg>',q='<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C10.3817 22 8.81782 21.6146 7.41286 20.888L3.58704 21.9553C2.92212 22.141 2.23258 21.7525 2.04691 21.0876C1.98546 20.8676 1.98549 20.6349 2.04695 20.4151L3.11461 16.5922C2.38637 15.186 2 13.6203 2 12C2 6.47715 6.47715 2 12 2ZM12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 13.4696 3.87277 14.8834 4.57303 16.1375L4.72368 16.4072L3.61096 20.3914L7.59755 19.2792L7.86709 19.4295C9.12006 20.1281 10.5322 20.5 12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM12 15.5C12.5523 15.5 13 15.9477 13 16.5C13 17.0523 12.5523 17.5 12 17.5C11.4477 17.5 11 17.0523 11 16.5C11 15.9477 11.4477 15.5 12 15.5ZM12 6.75C13.5188 6.75 14.75 7.98122 14.75 9.5C14.75 10.5108 14.4525 11.074 13.6989 11.8586L13.5303 12.0303C12.9084 12.6522 12.75 12.9163 12.75 13.5C12.75 13.9142 12.4142 14.25 12 14.25C11.5858 14.25 11.25 13.9142 11.25 13.5C11.25 12.4892 11.5475 11.926 12.3011 11.1414L12.4697 10.9697C13.0916 10.3478 13.25 10.0837 13.25 9.5C13.25 8.80964 12.6904 8.25 12 8.25C11.3528 8.25 10.8205 8.74187 10.7565 9.37219L10.75 9.5C10.75 9.91421 10.4142 10.25 10 10.25C9.58579 10.25 9.25 9.91421 9.25 9.5C9.25 7.98122 10.4812 6.75 12 6.75Z"></path></svg>',B='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M11.25 6.75073C11.25 6.33652 11.5858 6.00073 12 6.00073C12.4142 6.00073 12.75 6.33652 12.75 6.75073V8.25076C12.75 8.66498 12.4142 9.00076 12 9.00076C11.5858 9.00076 11.25 8.66498 11.25 8.25076V6.75073ZM16.2803 8.21607C15.9874 7.92318 15.5126 7.92318 15.2197 8.21607L14.159 9.27675C13.8661 9.56964 13.8661 10.0445 14.159 10.3374C14.4519 10.6303 14.9268 10.6303 15.2197 10.3374L16.2803 9.27673C16.5732 8.98384 16.5732 8.50896 16.2803 8.21607ZM8.78032 8.21607C8.48743 7.92318 8.01255 7.92318 7.71966 8.21607C7.42677 8.50896 7.42677 8.98384 7.71966 9.27673L8.78034 10.3374C9.07324 10.6303 9.54811 10.6303 9.841 10.3374C10.1339 10.0445 10.1339 9.56964 9.841 9.27675L8.78032 8.21607ZM12 2.00098C16.0041 2.00098 19.25 5.24691 19.25 9.25098C19.25 11.347 18.3493 13.2707 16.5869 14.9929C16.51 15.0681 16.4504 15.1586 16.4118 15.2582L16.3804 15.3605L15.2493 20.2561C15.0266 21.22 14.2035 21.9183 13.2302 21.993L13.057 21.9996H10.9433C9.95374 21.9996 9.08791 21.3545 8.79629 20.4228L8.75088 20.2555L7.62132 15.3607C7.58904 15.2208 7.51728 15.0931 7.41456 14.9928C5.73515 13.3526 4.83778 11.5297 4.75613 9.54923L4.75 9.25098L4.75388 9.01166C4.88014 5.11837 8.07601 2.00098 12 2.00098ZM14.115 18.499H9.884L10.2125 19.9182C10.2831 20.2245 10.5357 20.4504 10.8401 20.4925L10.9433 20.4996H13.057C13.3713 20.4996 13.6481 20.3044 13.7577 20.0174L13.7878 19.9184L14.115 18.499ZM12 3.50098C8.89821 3.50098 6.37006 5.95699 6.25415 9.03042L6.25 9.25098L6.25672 9.52799C6.33286 11.0913 7.05722 12.5471 8.46262 13.9197C8.72675 14.1777 8.92265 14.496 9.03422 14.846L9.08291 15.0235L9.538 16.999H11.25V10.7503C11.25 10.3361 11.5858 10.0003 12 10.0003C12.4142 10.0003 12.75 10.3361 12.75 10.7503V16.999H14.461L14.9189 15.0228C15.0019 14.6634 15.1718 14.3309 15.4124 14.0539L15.5386 13.9201C16.9432 12.5475 17.6672 11.0916 17.7433 9.52803L17.75 9.25098L17.7458 9.03042C17.6299 5.95699 15.1018 3.50098 12 3.50098Z"/></svg>',D='<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C17.5228 2 22 6.47715 22 12C22 12.2628 21.9899 12.5232 21.97 12.7809C21.5319 12.3658 21.0361 12.0111 20.4958 11.73C20.3532 7.16054 16.6041 3.5 12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 13.4696 3.87277 14.8834 4.57303 16.1375L4.72368 16.4072L3.61096 20.3914L7.59755 19.2792L7.86709 19.4295C9.04305 20.0852 10.3592 20.4531 11.73 20.4958C12.0111 21.0361 12.3658 21.5319 12.7809 21.97C12.5232 21.9899 12.2628 22 12 22C10.3817 22 8.81782 21.6146 7.41286 20.888L3.58704 21.9553C2.92212 22.141 2.23258 21.7525 2.04691 21.0876C1.98546 20.8676 1.98549 20.6349 2.04695 20.4151L3.11461 16.5922C2.38637 15.186 2 13.6203 2 12C2 6.47715 6.47715 2 12 2ZM23 17.5C23 14.4624 20.5376 12 17.5 12C14.4624 12 12 14.4624 12 17.5C12 20.5376 14.4624 23 17.5 23C20.5376 23 23 20.5376 23 17.5ZM18.0006 18L18.0011 20.5035C18.0011 20.7797 17.7773 21.0035 17.5011 21.0035C17.225 21.0035 17.0011 20.7797 17.0011 20.5035L17.0006 18H14.4956C14.2197 18 13.9961 17.7762 13.9961 17.5C13.9961 17.2239 14.2197 17 14.4956 17H17.0005L17 14.4993C17 14.2231 17.2239 13.9993 17.5 13.9993C17.7761 13.9993 18 14.2231 18 14.4993L18.0005 17H20.4966C20.7725 17 20.9961 17.2239 20.9961 17.5C20.9961 17.7762 20.7725 18 20.4966 18H18.0006Z"></path></svg>';var j=Object.defineProperty,Z=Object.getOwnPropertyDescriptor,x=(t,e,o,r)=>{for(var s=r>1?void 0:r?Z(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(r?n(e,o,s):n(s))||s);return r&&s&&j(e,o,s),s};let p=class extends y{constructor(){super(...arguments),this.details={thoughts:"",dataPoints:[]},this.showThoughtProcess=!0,this.renderThoughtProcess=t=>i`${z(t)}`,this.renderDataPoints=t=>{const e=t.map(o=>{const[r,...s]=o.split(":");return{title:r,extract:s.join(":")}});return i`<div class="data-points">
      ${m(e,o=>i`<div class="card">
            <div class="title">${o.title}</div>
            <div>${o.extract}</div>
          </div>`)}
    </div>`}}render(){return i`<aside class="debug-container">
      <slot name="close-button"></slot>
      <nav class="nav">
        <button class=${this.showThoughtProcess?"active":""} @click=${()=>this.showThoughtProcess=!0}>
          ${this.options.strings.thoughtsTitle}
        </button>
        <button class=${this.showThoughtProcess?"":"active"} @click=${()=>this.showThoughtProcess=!1}>
          ${this.options.strings.supportingContentTitle}
        </button>
      </nav>
      <section class="content">
        ${this.showThoughtProcess?this.renderThoughtProcess(this.details.thoughts):this.renderDataPoints(this.details.dataPoints)}
      </section>
    </aside>`}};p.styles=C`
    *:focus-visible {
      outline: var(--focus-outline) var(--primary);
    }
    button {
      padding: var(--space-md);
      font-size: 1rem;
      outline: var(--focus-outline) transparent;
      transition: outline 0.3s ease;
      border: none;

      &:not(:disabled) {
        cursor: pointer;
      }
      &:hover:not(:disabled) {
        // TODO: separate out hover style
        background: var(--submit-button-bg-hover);
      }
    }
    .active {
      border-bottom: 3px solid var(--primary);
    }
    .nav {
      padding-bottom: var(--space-md);
    }
    .debug-container {
      position: absolute;
      inset: var(--space-xl);
      display: flex;
      flex-direction: column;
      border-radius: var(--border-radius);
      background: var(--bg);
      overflow: hidden;
      padding: var(--space-xl);
      margin: 0px auto;
      max-width: 1024px;
    }
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
    .title {
      font-weight: bold;
      margin-bottom: var(--space-md);
    }
    .card {
      padding: var(--space-md);
      margin-bottom: var(--space-md);
      border-radius: var(--border-radius);
      // TODO: separate out card styles
      color: var(--bot-message-color);
      background: var(--bot-message-bg);
      border: var(--bot-message-border);
      box-shadow: var(--card-shadow);
    }
  `;x([h({type:Object})],p.prototype,"details",2);x([h({type:Object})],p.prototype,"options",2);x([h({type:Boolean})],p.prototype,"showThoughtProcess",2);p=x([w("azc-debug")],p);var I=Object.defineProperty,U=Object.getOwnPropertyDescriptor,u=(t,e,o,r)=>{for(var s=r>1?void 0:r?U(e,o):e,a=t.length-1,n;a>=0;a--)(n=t[a])&&(s=(r?n(e,o,s):n(s))||s);return r&&s&&I(e,o,s),s};const k={enableContentLinks:!1,stream:!1,chunkIntervalMs:30,apiUrl:"",enablePromptSuggestions:!0,promptSuggestions:["How to search and book rentals?","What is the refund policy?","How to contact a representative?"],messages:[],strings:{promptSuggestionsTitle:"Ask anything or try an example",citationsTitle:"Citations:",followUpQuestionsTitle:"Follow-up questions:",showThoughtProcessTitle:"Show thought process",closeTitle:"Close",thoughtsTitle:"Thought process",supportingContentTitle:"Supporting Content",chatInputPlaceholder:"Ask me anything...",chatInputButtonLabel:"Send question",assistant:"Support Assistant",user:"You",errorMessage:"We are currently experiencing an issue.",newChatButton:"New chat",retryButton:"Retry"}};let c=class extends y{constructor(){super(...arguments),this.options=k,this.question="",this.messages=[],this.hasError=!1,this.isLoading=!1,this.isStreaming=!1,this.renderSuggestions=t=>i`
      <section class="suggestions-container">
        <h2>${this.options.strings.promptSuggestionsTitle}</h2>
        <div class="suggestions">
          ${m(t,e=>i`
              <button class="suggestion" @click=${()=>this.onSuggestionClicked(e)}>${e}</button>
            `)}
        </div>
      </section>
    `,this.renderLoader=()=>this.isLoading&&!this.isStreaming?i`
          <div class="message assistant loader">
            <div class="message-body">
              <slot name="loader"><div class="loader-animation"></div></slot>
              <div class="message-role">${this.options.strings.assistant}</div>
            </div>
          </div>
        `:g,this.renderMessage=t=>i`
      <div class="message ${t.role} animation">
        ${t.role==="assistant"?i`<slot name="message-header">
              <div class="debug-buttons">
                <button
                  class="button"
                  @click=${()=>this.onShowDebugClicked(t.context)}
                  title=${this.options.strings.showThoughtProcessTitle}
                >
                  ${v(B)}
                </button>
              </div>
            </slot>`:g}
        <div class="message-body">
          <div class="content">${t.html}</div>
          ${t.citations.length>0?i`
                <div class="citations">
                  <div class="citations-title">${this.options.strings.citationsTitle}</div>
                  ${m(t.citations,this.renderCitation)}
                </div>
              `:g}
        </div>
        <div class="message-role">
          ${t.role==="user"?this.options.strings.user:this.options.strings.assistant}
        </div>
      </div>
    `,this.renderError=()=>i`
      <div class="message assistant error">
        <div class="message-body">
          <span class="error-message">${this.options.strings.errorMessage}</span>
          <button @click=${()=>this.onSendClicked(!0)}>${this.options.strings.retryButton}</button>
        </div>
      </div>
    `,this.renderCitation=(t,e)=>i`<button class="citation" @click=${()=>this.onCitationClicked(t)}>
      ${e+1}. ${t}
    </button>`,this.renderCitationLink=(t,e)=>i`<button class="citation-link" @click=${()=>this.onCitationClicked(t)}>
      <sup>[${e}]</sup>
    </button>`,this.renderFollowupQuestions=t=>t.length>0?i`
          <div class="questions">
            <span class="question-icon" title=${this.options.strings.followUpQuestionsTitle}>
              ${v(q)} </span
            >${m(t,e=>i`
                <button class="question animation" @click=${()=>this.onSuggestionClicked(e)}>
                  ${e}
                </button>
              `)}
          </div>
        `:g,this.renderChatInput=()=>{var t;return i`
      <div class="chat-input">
        <button
          class="button new-chat-button"
          @click=${()=>this.messages=[]}
          title=${this.options.strings.newChatButton}
          .disabled=${((t=this.messages)==null?void 0:t.length)===0||this.isLoading||this.isStreaming}
        >
          ${v(D)}
        </button>
        <form class="input-form">
          <textarea
            class="text-input"
            placeholder="${this.options.strings.chatInputPlaceholder}"
            .value=${this.question}
            autocomplete="off"
            @input=${e=>this.question=e.target.value}
            @keypress=${this.onKeyPressed}
            .disabled=${this.isLoading}
          ></textarea>
          <button
            class="submit-button"
            @click=${()=>this.onSendClicked()}
            title="${this.options.strings.chatInputButtonLabel}"
            .disabled=${this.isLoading||!this.question}
          >
            ${v(_)}
          </button>
        </form>
      </div>
    `}}onSuggestionClicked(t){this.question=t,this.onSendClicked()}onCitationClicked(t){if(this.options.enableContentLinks){const e=P(t);window.open(e,"_blank")}}onKeyPressed(t){t.key==="Enter"&&(t.preventDefault(),this.onSendClicked())}onShowDebugClicked(t={}){this.debugDetails={thoughts:t.thoughts??"",dataPoints:t.data_points??[]}}async onSendClicked(t=!1){var e,o,r;if(!this.isLoading){this.hasError=!1,t||(this.messages=[...this.messages,{content:this.question,role:"user"}]),this.question="",this.isLoading=!0,this.scrollToLastMessage();try{const s=await T({...this.options,messages:this.messages});if(this.options.stream){this.isStreaming=!0;const a=s,n=this.messages,l={content:"",role:"assistant",context:{data_points:[],thoughts:""}};for await(const d of a)(e=d.choices[0].delta.context)!=null&&e.data_points?(l.context.data_points=(o=d.choices[0].delta.context)==null?void 0:o.data_points,l.context.thoughts=((r=d.choices[0].delta.context)==null?void 0:r.thoughts)??""):d.choices[0].delta.content&&(l.content+=d.choices[0].delta.content,this.messages=[...n,l],this.scrollToLastMessage())}else{const a=s;this.messages=[...this.messages,a.choices[0].message],this.scrollToLastMessage()}this.isLoading=!1,this.isStreaming=!1}catch(s){this.hasError=!0,this.isLoading=!1,this.isStreaming=!1,console.error(s)}}}requestUpdate(t,e){if(t==="messages"){const o=new CustomEvent("messagesUpdated",{detail:{messages:this.messages},bubbles:!0});this.dispatchEvent(o)}else if(t==="hasError"||t==="isLoading"||t==="isStreaming"){const o={hasError:this.hasError,isLoading:this.isLoading,isStreaming:this.isStreaming},r=new CustomEvent("stateChanged",{detail:{state:o},bubbles:!0});this.dispatchEvent(r)}return super.requestUpdate(t,e)}scrollToLastMessage(){setTimeout(()=>{const{bottom:t}=this.messagesElement.getBoundingClientRect(),{top:e}=this.chatInputElement.getBoundingClientRect();t>e&&window.scrollBy(0,t-e)},0)}render(){var e;const t=this.messages.map(o=>E(o,this.renderCitationLink));return i`
      <section class="chat-container">
        ${this.options.enablePromptSuggestions&&this.options.promptSuggestions.length>0&&this.messages.length===0?this.renderSuggestions(this.options.promptSuggestions):g}
        <div class="messages">
          ${S(t,(o,r)=>r,this.renderMessage)} ${this.renderLoader()}
          ${this.hasError?this.renderError():g}
          ${this.renderFollowupQuestions(((e=t.at(-1))==null?void 0:e.followupQuestions)??[])}
        </div>
        ${this.renderChatInput()}
      </section>
      ${this.debugDetails?i`<section class="debug-details">
            <azc-debug .details=${this.debugDetails} .options=${this.options}>
              <button
                slot="close-button"
                class="button close-button"
                @click=${()=>this.debugDetails=void 0}
                title=${this.options.strings.closeTitle}
              >
                X
              </button>
            </azc-debug>
          </section>`:g}
    `}};c.styles=C`
    :host {
      /* Base properties */
      --primary: var(--azc-primary, #07f);
      --error: var(--azc-error, #e30);
      --text-color: var(--azc-text-color, #000);
      --text-invert-color: var(--azc--text-invert-color, #fff);
      --disabled-color: var(--azc-disabled-color, #ccc);
      --bg: var(--azc-bg, #eee);
      --card-bg: var(--azc-card-bg, #fff);
      --card-shadow: var(--azc-card-shadow, 0 0.3px 0.9px rgba(0 0 0 / 12%), 0 1.6px 3.6px rgba(0 0 0 / 16%));
      --space-md: var(--azc-space-md, 12px);
      --space-xl: var(--azc-space-xl, calc(var(--space-md) * 2));
      --space-xs: var(--azc-space-xs, calc(var(--space-md) / 2));
      --space-xxs: var(--azc-space-xs, calc(var(--space-md) / 4));
      --border-radius: var(--azc-border-radius, 16px);
      --focus-outline: var(--azc-focus-outline, 2px solid);
      --overlay-color: var(--azc-overlay-color, rgba(0 0 0 / 40%));

      /* Component-specific properties */
      --error-color: var(--azc-error-color, var(--error));
      --error-border: var(--azc-error-border, none);
      --error-bg: var(--azc-error-bg, var(--card-bg));
      --retry-button-color: var(--azc-retry-button-color, var(--text-color));
      --retry-button-bg: var(--azc-retry-button-bg, #f0f0f0);
      --retry-button-bg-hover: var(--azc-retry-button-bg, #e5e5e5);
      --retry-button-border: var(--azc-retry-button-border, none);
      --suggestion-color: var(--azc-suggestion-color, var(--text-color));
      --suggestion-border: var(--azc-suggestion-border, none);
      --suggestion-bg: var(--azc-suggestion-bg, var(--card-bg));
      --suggestion-shadow: var(--azc-suggestion-shadow, 0 6px 16px -1.5px rgba(141 141 141 / 30%));
      --user-message-color: var(--azc-user-message-color, var(--text-invert-color));
      --user-message-border: var(--azc-user-message-border, none);
      --user-message-bg: var(--azc-user-message-bg, var(--primary));
      --bot-message-color: var(--azc-bot-message-color, var(--text-color));
      --bot-message-border: var(--azc-bot-message-border, none);
      --citation-color: var(--azc-citation-color, var(--text-invert-color));
      --bot-message-bg: var(--azc-bot-message-bg, var(--card-bg));
      --citation-bg: var(--azc-citation-bg, var(--primary));
      --citation-bg-hover: var(--azc-citation-bg, color-mix(in srgb, var(--primary), #000 10%));
      --new-chat-button-color: var(--azc-button-color, var(--text-invert-color));
      --new-chat-button-bg: var(--azc-new-chat-button-bg, var(--primary));
      --new-chat-button-bg-hover: var(--azc-new-chat-button-bg, color-mix(in srgb, var(--primary), #000 10%));
      --chat-input-color: var(--azc-chat-input-color, var(--text-color));
      --chat-input-border: var(--azc-chat-input-border, none);
      --chat-input-bg: var(--azc-chat-input-bg, var(--card-bg));
      --submit-button-color: var(--azc-button-color, var(--primary));
      --submit-button-border: var(--azc-submit-button-border, none);
      --submit-button-bg: var(--azc-submit-button-bg, none);
      --submit-button-bg-hover: var(--azc-submit-button-color, #f0f0f0);
    }
    *:focus-visible {
      outline: var(--focus-outline) var(--primary);
    }
    .animation {
      animation: 0.3s ease;
    }
    svg {
      fill: currentColor;
    }
    button {
      font-size: 1rem;
      border-radius: calc(var(--border-radius) / 2);
      outline: var(--focus-outline) transparent;
      transition: outline 0.3s ease;

      &:not(:disabled) {
        cursor: pointer;
      }
    }
    .chat-container {
      container-type: inline-size;
      position: relative;
      background: var(--bg);
      font-family:
        'Segoe UI',
        -apple-system,
        BlinkMacSystemFont,
        Roboto,
        'Helvetica Neue',
        sans-serif;
    }
    .citation-link {
      padding: 0;
      color: var(--primary);
      background: none;
      border: none;
      white-space: normal;
    }
    .citation {
      font-size: 0.85rem;
      color: var(--citation-color);
      background: var(--citation-bg);
      border: var(--citation-border);
      padding: var(--space-xxs) var(--space-xs);
      margin-right: var(--space-xs);
      margin-top: var(--space-xs);

      &:hover {
        background: var(--citation-bg-hover);
      }
    }
    .citations-title {
      font-weight: bold;
    }
    .suggestions-container {
      text-align: center;
      padding: var(--space-xl);
    }
    .suggestions {
      display: flex;
      gap: var(--space-md);
    }
    @container (width < 480px) {
      .suggestions {
        flex-direction: column;
      }
    }

    .suggestion {
      flex: 1 1 0;
      padding: var(--space-xl) var(--space-md);
      color: var(--sugestion-color);
      background: var(--suggestion-bg);
      border: var(--suggestion-border);
      border-radius: var(--border-radius);
      box-shadow: var(--suggestion-shadow);

      &:hover {
        outline: var(--focus-outline) var(--primary);
      }
    }
    .messages {
      padding: var(--space-xl);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }
    .user {
      align-self: end;
      color: var(--user-message-color);
      background: var(--user-message-bg);
      border: var(--user-message-border);
    }
    .assistant {
      color: var(--bot-message-color);
      background: var(--bot-message-bg);
      border: var(--bot-message-border);
      box-shadow: var(--card-shadow);
    }
    .message {
      position: relative;
      width: auto;
      max-width: 70%;
      border-radius: var(--border-radius);
      padding: var(--space-xl);
      margin-bottom: var(--space-xl);
      &.user {
        animation-name: fade-in-up;
      }
    }
    .message-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }
    .content {
      white-space: pre-line;
    }
    .message-role {
      position: absolute;
      right: var(--space-xl);
      bottom: -1.25em;
      color: var(--text-color);
      font-size: 0.85rem;
      opacity: 0.6;
    }
    .questions {
      margin: var(--space-md) 0;
      color: var(--primary);
      text-align: right;
    }
    .question-icon {
      vertical-align: middle;
      display: inline-block;
      height: 1.7rem;
      width: 1.7rem;
      margin-bottom: var(--space-xs);
      margin-left: var(--space-xs);
    }
    .question {
      position: relative;
      padding: var(--space-xs) var(--space-md);
      margin-bottom: var(--space-xs);
      margin-left: var(--space-xs);
      vertical-align: middle;
      color: var(--primary);
      background: var(--card-bg);
      border: 1px solid var(--primary);
      animation-name: fade-in-right;
      &:hover {
        background: color-mix(in srgb, var(--card-bg), var(--primary) 5%);
      }
    }
    .debug-buttons {
      display: flex;
      justify-content: right;
      gap: var(--space-md);
      margin-bottom: var(--space-md);
    }
    .debug-details {
      position: fixed;
      inset: 0;
      background: var(--overlay-color);
    }
    .button,
    .submit-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xs);
      border: var(--button-border);
      background: var(--submit-button-bg);
      color: var(--submit-button-color);
      &:disabled {
        color: var(--disabled-color);
      }
      &:hover:not(:disabled) {
        background: var(--submit-button-bg-hover);
      }
    }
    .submit-button {
      padding: 0;
      width: 48px;
    }
    .close-button {
      position: absolute;
      top: var(--space-md);
      right: var(--space-md);
      width: auto;
      padding: var(--space-md);
      &:hover:not(:disabled) {
        background: var(--card-bg);
      }
    }
    .error {
      color: var(--error-color);
      background: var(--error-bg);
      outline: var(--focus-outline) var(--error);

      & .message-body {
        flex-direction: row;
        align-items: center;
      }

      & button {
        flex: 0;
        padding: var(--space-md);
        color: var(--retry-button-color);
        background: var(--retry-button-bg);
        border: var(--retry-button-border);

        &:hover {
          background: var(--retry-button-bg-hover);
        }
      }
    }
    .error-message {
      flex: 1;
    }
    .chat-input {
      --half-space-xl: calc(var(--space-xl) / 2);
      position: sticky;
      bottom: 0;
      padding: var(--space-xl);
      padding-top: var(--half-space-xl);
      background: var(--bg);
      box-shadow: 0 calc(-1 * var(--half-space-xl)) var(--half-space-xl) var(--bg);
      display: flex;
      gap: var(--space-md);
    }
    .new-chat-button {
      width: 48px;
      height: 48px;
      padding: var(--space-md);
      border-radius: 50%;
      background: var(--new-chat-button-bg);
      color: var(--new-chat-button-color);
      font-size: 1.5rem;
      &:hover:not(:disabled) {
        background: var(--new-chat-button-bg-hover);
        color: var(--new-chat-button-color);
      }
    }
    .input-form {
      display: flex;
      flex: 1 auto;
      background: var(--chat-input-bg);
      border: var(--chat-input-border);
      border-radius: var(--border-radius);
      padding: var(--space-md);
      box-shadow: var(--card-shadow);
      outline: var(--focus-outline) transparent;
      transition: outline 0.3s ease;

      &:has(.text-input:focus-visible) {
        outline: var(--focus-outline) var(--primary);
      }
    }
    .text-input {
      padding: var(--space-xs);
      font-family: inherit;
      font-size: 1rem;
      flex: 1 auto;
      height: 3rem;
      border: none;
      resize: none;
      background: none;
      &::placeholder {
        color: var(--text-color);
        opacity: 0.4;
      }
      &:focus {
        outline: none;
      }
      &:disabled {
        opacity: 0.7;
      }
    }
    .loader-animation {
      width: 100px;
      height: 4px;
      border-radius: var(--border-radius);
      overflow: hidden;
      background-color: var(--primary);
      transform: scaleX(0);
      transform-origin: center left;
      animation: cubic-bezier(0.85, 0, 0.15, 1) 2s infinite load-animation;
    }

    @keyframes load-animation {
      0% {
        transform: scaleX(0);
        transform-origin: center left;
      }
      50% {
        transform: scaleX(1);
        transform-origin: center left;
      }
      51% {
        transform: scaleX(1);
        transform-origin: center right;
      }
      100% {
        transform: scaleX(0);
        transform-origin: center right;
      }
    }
    @keyframes fade-in-up {
      0% {
        opacity: 0.5;
        top: 100px;
      }
      100% {
        opacity: 1;
        top: 0px;
      }
    }
    @keyframes fade-in-right {
      0% {
        opacity: 0.5;
        right: -100px;
      }
      100% {
        opacity: 1;
        right: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .animation {
        animation: none;
      }
    }
  `;u([h({type:Object,converter:t=>({...k,...JSON.parse(t||"{}")})})],c.prototype,"options",2);u([h()],c.prototype,"question",2);u([h({type:Array})],c.prototype,"messages",2);u([f()],c.prototype,"hasError",2);u([f()],c.prototype,"isLoading",2);u([f()],c.prototype,"isStreaming",2);u([f()],c.prototype,"debugDetails",2);u([L(".messages")],c.prototype,"messagesElement",2);u([L(".chat-input")],c.prototype,"chatInputElement",2);c=u([w("azc-chat")],c);
//# sourceMappingURL=index-4LLPZTDq.js.map
