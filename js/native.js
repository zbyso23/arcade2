/* Native DOM views, local script registry and state notifications. No external runtime. */
'use strict';
window.ArcadeModules = (() => {
  const factories = new Map(), cache = new Map();
  function load(id, from = '') {
    if (id.startsWith('.')) {
      const parts = from.split('/'); parts.pop();
      for (const p of id.split('/')) { if (p === '..') parts.pop(); else if (p !== '.') parts.push(p); }
      id = parts.join('/');
    }
    if (cache.has(id)) return cache.get(id);
    if (!factories.has(id)) throw new Error('Missing local script: ' + id);
    const result = {__esModule: true}; cache.set(id, result);
    factories.get(id)(name => load(name, id), result);
    return result;
  }
  return {define: (id, factory) => factories.set(id, factory), load};
})();
window.ArcadeDOM = (() => {
  const pending = new Set(); let scheduled = false;
  const element = (type, props = {}, key) => ({type, props: props || {}, key: key === undefined ? undefined : String(key)});
  function flush() {
    scheduled = false;
    const batch = [...pending]; pending.clear();
    for (const view of batch) if (view._mounted) update(view);
  }
  class View {
    constructor(props = {}) { this.props = props; this.state = {}; this.context = {store: window.ArcadeStore}; this.refs = {}; }
    setState(patch, callback) {
      Object.assign(this.state, typeof patch === 'function' ? patch(this.state, this.props) : patch);
      if (this._mounted) {
        pending.add(this);
        if (!scheduled) { scheduled = true; queueMicrotask(flush); }
      }
      if (callback) queueMicrotask(() => { if (this._mounted) callback.call(this); });
    }
    later(fn,delay) {
      this._timeouts ||= new Set();
      const id=setTimeout(()=>{this._timeouts.delete(id);if(!this._destroyed)fn();},delay);
      this._timeouts.add(id);return id;
    }
    forceUpdate() { this.setState({}); }
  }
  function children(props) { return [props.children].flat(Infinity).filter(x => x !== undefined && x !== null && x !== false && x !== true); }
  function normalized(v) { return v == null || typeof v === 'boolean' ? '' : v; }
  function setProps(node, old, props) {
    for (const name of new Set([...Object.keys(old), ...Object.keys(props)])) {
      if (name === 'children' || name === 'ref' || name === 'key') continue;
      const value = props[name]; if (value === old[name]) continue;
      if (name.startsWith('on')) {
        const event = name.slice(2).toLowerCase();
        const actual = event === 'change' && /^(INPUT|TEXTAREA)$/.test(node.tagName) && !['checkbox','radio','file'].includes(node.type) ? 'input' : event;
        if (old[name]) node.removeEventListener(actual, old[name]);
        if (value) node.addEventListener(actual, value);
      } else if (name === 'style') {
        for (const k of new Set([...Object.keys(old.style || {}), ...Object.keys(value || {})])) {
          let v = (value || {})[k] ?? '';
          if (typeof v === 'number' && v !== 0 && !/^(opacity|zIndex|fontWeight|flex|order|lineHeight)$/.test(k)) v += 'px';
          node.style[k] = v;
        }
      } else if (name === 'className') node.className = value || '';
      else if (name === 'htmlFor') node.htmlFor = value || '';
      else if (name === 'value' || name === 'checked' || name === 'selected' || name === 'disabled' || name === 'width' || name === 'height') {
        if (value !== undefined && value !== null && node[name] !== value) node[name] = value;
      } else if (value === false || value == null) node.removeAttribute(name);
      else node.setAttribute(name, value === true ? '' : String(value));
    }
  }
  function ref(v, owner, node) {
    if (!v || !v.props) return;
    if (typeof v.props.ref === 'function') v.props.ref(node);
    else if (typeof v.props.ref === 'string' && owner) owner.refs[v.props.ref] = node;
  }
  function create(value, owner) {
    const v = normalized(value);
    if (typeof v !== 'object') return {v, node: document.createTextNode(String(v))};
    if (typeof v.type === 'function') {
      if (!(v.type.prototype instanceof View)) return create(v.type(v.props), owner);
      const view = new v.type(v.props);
      const record = {v, view, node: null}; view._record = record;
      record.child = create(view.render(), view); record.node = record.child.node;
      queueMicrotask(() => { if (view._destroyed) return; view._mounted = true; view.componentDidMount?.(); });
      return record;
    }
    const node = document.createElement(v.type), record = {v, node, children: []};
    setProps(node, {}, v.props);
    for (const child of children(v.props)) { const r = create(child, owner); record.children.push(r); node.append(r.node); }
    // select values apply after options exist
    if (v.type === 'select' && v.props.value !== undefined) node.value = v.props.value;
    ref(v, owner, node); return record;
  }
  function destroy(record) {
    if (record.view) {
      record.view._destroyed = true; record.view._mounted = false; pending.delete(record.view);
      for(const id of record.view._timeouts || [])clearTimeout(id);
      record.view.componentWillUnmount?.(); destroy(record.child);
    } else if (record.children) for (const child of record.children) destroy(child);
  }
  function reconcile(parent, record, value, owner) {
    const v = normalized(value), old = record.v;
    if (typeof v !== 'object' && typeof old !== 'object') {
      if (record.node.nodeValue !== String(v)) record.node.nodeValue = String(v); record.v = v; return record;
    }
    if (typeof v !== 'object' || typeof old !== 'object' || v.type !== old.type || v.key !== old.key) {
      const next = create(v, owner); parent.replaceChild(next.node, record.node); destroy(record); return next;
    }
    record.v = v;
    if (record.view) { record.view.props = v.props; update(record.view); return record; }
    if (typeof v.type === 'function') return record;
    setProps(record.node, old.props, v.props);
    const nextValues = children(v.props), oldChildren = record.children, nextChildren = [], used = new Set();
    for (let i = 0; i < nextValues.length; i++) {
      const value = nextValues[i]; const key = typeof value === 'object' ? value.key : undefined;
      let index = key !== undefined ? oldChildren.findIndex((r, j) => !used.has(j) && r.v?.key === key && r.v?.type === value.type) : i;
      // A temporary loader must not replace a keyed canvas and orphan its context.
      if(key === undefined && oldChildren[index]?.v?.key !== undefined) index=-1;
      if (index < 0 || used.has(index) || !oldChildren[index]) { const r = create(value, owner); nextChildren.push(r); record.node.insertBefore(r.node, record.node.childNodes[i] || null); }
      else { used.add(index); const r = reconcile(record.node, oldChildren[index], value, owner); nextChildren.push(r); if(record.node.childNodes[i] !== r.node)record.node.insertBefore(r.node, record.node.childNodes[i] || null); }
    }
    for (let i=0;i<oldChildren.length;i++) if(!used.has(i)) { destroy(oldChildren[i]); oldChildren[i].node.remove(); }
    record.children = nextChildren;
    if (v.type === 'select' && v.props.value !== undefined) record.node.value = v.props.value;
    return record;
  }
  function update(view) {
    if (!view._mounted || !view._record?.node.parentNode) return;
    const r = view._record; r.child = reconcile(r.node.parentNode, r.child, view.render(), view); r.node = r.child.node;
  }
  let root;
  function mount(v, parent) { if (root) { destroy(root); root.node.remove(); } root = create(v); parent.append(root.node); }
  class Link extends View { render() { return element('a', {...this.props, href: '#' + this.props.to, to: undefined}); } }
  return {element, View, Link, mount};
})();
ArcadeModules.define('native/dom', (_, exports) => { exports.element = ArcadeDOM.element; });
