// Editable vanilla JavaScript — loaded directly by index.html.
ArcadeModules.define("components/EditorMapItemAdd", function (local, exports) {
  const {
    View,
    Link
  } = ArcadeDOM;
  "use strict";
  exports.default = void 0;
  var _gameMapReducer = local("../reducers/gameMapReducer");
  var dom = local("native/dom");
  function mapStateFromStore(store, state) {
    let newState = Object.assign({}, state);
    return newState;
  }
  class EditorMapQuestAdd extends View {
    constructor(props) {
      super(props);
      this.unsubscribe = void 0;
      this.state = {
        itemSelected: (0, _gameMapReducer.getDefaultItemState)(),
        exit: [],
        items: [],
        environment: [],
        enemy: [],
        quests: [],
        types: [],
        selected: {
          finished: {
            experience: 0,
            exit: [],
            items: [],
            environment: [],
            enemy: [],
            quest: []
          }
        }
      };
      this.changeText = this.changeText.bind(this);
      this.toggleVisible = this.toggleVisible.bind(this);
      this.changeType = this.changeType.bind(this);
      this.changeExperience = this.changeExperience.bind(this);
    }
    componentDidMount() {
      let storeState = this.context.store.getState();
      let newState = Object.assign({}, this.state);
      let exit = [];
      let items = [];
      let environment = [];
      let enemy = [];
      let quests = [];
      let types = [];
      for (let i in storeState.world.maps) {
        let mapName = i;
        let map = storeState.world.maps[i];
        for (let i = 0, len = map.exit.length; i < len; i++) {
          exit.push({
            map: mapName,
            x: map.exit[i].x,
            y: map.exit[i].y,
            name: map.exit[i].type.name,
            hide: !map.exit[i].visible
          });
        }
        for (let i = 0, len = map.items.length; i < len; i++) {
          items.push({
            map: mapName,
            x: map.items[i].x,
            y: map.items[i].y,
            name: map.items[i].name,
            hide: !map.items[i].visible
          });
        }
        for (let i = 0, len = map.environment.length; i < len; i++) {
          environment.push({
            map: mapName,
            x: map.environment[i].x,
            y: map.environment[i].y,
            name: map.environment[i].name,
            hide: !map.environment[i].visible
          });
        }
        for (let i = 0, len = map.enemies.length; i < len; i++) {
          enemy.push({
            map: mapName,
            x: map.enemies[i].x,
            y: map.enemies[i].y,
            name: map.enemies[i].type,
            hide: !map.enemies[i].visible
          });
        }
        for (let i = 0, len = map.quests.length; i < len; i++) {
          quests.push({
            map: mapName,
            x: map.quests[i].x,
            y: map.quests[i].y,
            name: map.quests[i].name,
            hide: !map.quests[i].visible
          });
        }
      }
      for (let type in storeState.world.items) {
        types.push(storeState.world.items[type]);
      }
      newState.exit = exit;
      newState.items = items;
      newState.environment = environment;
      newState.enemy = enemy;
      newState.quests = quests;
      newState.types = types;
      newState.visible = true;
      if (this.props.id !== null) {
        newState = this.updateSelected(this.props.id, newState);
      }
      this.setState(newState);
    }
    componentWillUnmount() {}
    updateSelected(id, newState) {
      let storeState = this.context.store.getState();
      let item = storeState.world.maps[storeState.world.activeMap].items[this.props.id];
      newState.itemSelected = Object.assign({}, item);
      let sectionNames = ['finished'];
      for (let index in sectionNames) {
        let section = sectionNames[index];
        let trigger = null;
        let selected = null;
        switch (section) {
          case 'finished':
            trigger = newState.itemSelected.trigger;
            selected = newState.selected.finished;
            break;
        }
        let partNames = ['exit', 'items', 'enemy', 'environment', 'quest', 'experience'];
        for (let indexPart in partNames) {
          let part = partNames[indexPart];
          let partList = [];
          let selectedList = [];
          let triggerPart = null;
          switch (part) {
            case 'exit':
              partList = newState.exit;
              triggerPart = trigger.exit;
              selectedList = selected.exit;
              break;
            case 'items':
              partList = newState.items;
              triggerPart = trigger.items;
              selectedList = selected.items;
              break;
            case 'enemy':
              partList = newState.enemy;
              triggerPart = trigger.enemy;
              selectedList = selected.enemy;
              break;
            case 'environment':
              partList = newState.environment;
              triggerPart = trigger.environment;
              selectedList = selected.environment;
              break;
            case 'quest':
              partList = newState.quests;
              triggerPart = trigger.quest;
              selectedList = selected.quest;
              break;
            case 'experience':
              selected.experience = trigger.experience;
              continue;
          }
          if (triggerPart === null || triggerPart.length === 0) {
            continue;
          }
          for (let i = 0, len = partList.length; i < len; i++) {
            let triggerPartData = partList[i];
            let found = triggerPart.find(item => {
              return item.x === triggerPartData.x && item.y === triggerPartData.y && item.map === triggerPartData.map;
            });
            if (typeof found === "undefined") continue;
            selectedList.push({
              index: i,
              hide: found.hide
            });
          }
        }
      }
      return newState;
    }
    checkSelected(part, section, index) {
      if (['exit', 'items', 'enemy', 'environment', 'quest'].indexOf(part) === -1) return null;
      if (['finished'].indexOf(section) === -1) return null;
      let selected = null;
      switch (section) {
        case 'finished':
          selected = this.state.selected.finished;
          break;
      }
      let selectedList;
      switch (part) {
        case 'exit':
          selectedList = selected.exit;
          break;
        case 'items':
          selectedList = selected.items;
          break;
        case 'enemy':
          selectedList = selected.enemy;
          break;
        case 'environment':
          selectedList = selected.environment;
          break;
        case 'quest':
          selectedList = selected.quest;
          break;
      }
      for (let i = 0, len = selectedList.length; i < len; i++) {
        if (selectedList[i].index !== index) continue;
        return selectedList[i];
      }
      return null;
    }
    changePart(e, part, section, index) {
      e.preventDefault();
      let newState = Object.assign({}, this.state);
      let selected = null;
      switch (section) {
        case 'finished':
          selected = newState.selected.finished;
          break;
      }
      let selectedList;
      switch (part) {
        case 'exit':
          selectedList = selected.exit;
          break;
        case 'items':
          selectedList = selected.items;
          break;
        case 'enemy':
          selectedList = selected.enemy;
          break;
        case 'environment':
          selectedList = selected.environment;
          break;
        case 'quest':
          selectedList = selected.quest;
          break;
      }
      let partList;
      switch (part) {
        case 'exit':
          partList = newState.exit;
          break;
        case 'items':
          partList = newState.items;
          break;
        case 'enemy':
          partList = newState.enemy;
          break;
        case 'environment':
          partList = newState.environment;
          break;
        case 'quest':
          partList = newState.quests;
          break;
      }
      let selectedItem = null;
      let partItem = null;
      for (let i = 0, len = partList.length; i < len; i++) {
        if (i !== index) continue;
        selectedItem = this.checkSelected(part, section, i);
        partItem = partList[i];
      }
      if (partItem === null) return;
      if (selectedItem === null) {
        let defaultState = false;
        selectedList.push({
          index: index,
          hide: defaultState
        });
      } else {
        let newSelectedList = [];
        let removeIndex = -1;
        for (let i = 0, len = selectedList.length; i < len; i++) {
          if (selectedList[i].index !== index) continue;
          if (false === selectedItem.hide) {
            selectedList[i].hide = true;
            continue;
          }
          removeIndex = i;
        }
        if (removeIndex >= 0) selectedList.splice(removeIndex, 1);
      }
      this.setState(newState);
    }
    changeText(e, section) {
      e.preventDefault();
      let sectionNames = ['title', 'finished'];
      if (sectionNames.indexOf(section) === -1) return;
      let newState = Object.assign({}, this.state);
      switch (section) {
        case 'title':
          newState.itemSelected.text.title = e.target.value;
          break;
        case 'finished':
          newState.itemSelected.text.finished = e.target.value;
          break;
      }
      this.setState(newState);
    }
    changeExperience(e, section) {
      e.preventDefault();
      let value = parseInt(e.target.value);
      if (value < 0) return;
      let newState = Object.assign({}, this.state);
      switch (section) {
        case 'finished':
          newState.selected.finished.experience = value;
          break;
      }
      this.setState(newState);
    }
    toggleVisible(e) {
      e.preventDefault();
      let newState = Object.assign({}, this.state);
      newState.itemSelected.visible = !newState.itemSelected.visible;
      this.setState(newState);
    }
    createSection(section) {
      if (['finished'].indexOf(section) === -1) return null;
      let newState = Object.assign({}, this.state);
      let partsNames = ['exit', 'items', 'enemy', 'environment', 'quest'];
      let parts = [];
      for (let i = 0, len = partsNames.length; i < len; i++) {
        let part = this.createPart(partsNames[i], section);
        parts.push(part);
      }
      let name = 'experience';
      let key = ['select-part', section, 'experience'].join('-');
      let text = '';
      switch (section) {
        case 'finished':
          text = newState.selected.finished.experience.toString();
          break;
      }
      let style = {
        display: 'block',
        float: 'left',
        width: '100%',
        backgroundColor: '#f5b1b1',
        borderTop: '1px solid black',
        padding: '0.2vh'
      };
      let part = (0, dom.element)("div", {
        style: style,
        children: [name, (0, dom.element)("input", {
          onChange: e => this.changeExperience(e, section),
          value: text
        })]
      }, key);
      parts.push(part);
      key = ['select-section', section].join('-');
      let className = ['section'].join('-');
      let classNameHeader = ['section', 'header'].join('-');
      return (0, dom.element)("div", {
        className: className,
        children: [(0, dom.element)("div", {
          className: classNameHeader,
          children: section
        }), parts]
      }, key);
    }
    createPart(part, section) {
      let width = 92;
      let height = 104;
      if (['exit', 'items', 'enemy', 'environment', 'quest'].indexOf(part) === -1) return null;
      if (['finished'].indexOf(section) === -1) return null;
      let partList;
      switch (part) {
        case 'exit':
          partList = this.state.exit;
          break;
        case 'items':
          partList = this.state.items;
          break;
        case 'enemy':
          partList = this.state.enemy;
          break;
        case 'environment':
          partList = this.state.environment;
          break;
        case 'quest':
          partList = this.state.quests;
          break;
      }
      let typeStyle = {
        display: 'block',
        float: 'left',
        width: '100%',
        backgroundColor: '#a5b1b1',
        borderTop: '1px solid black',
        padding: '0.2vh'
      };
      let typeSelectedStyle = {
        display: 'block',
        float: 'left',
        width: '100%',
        backgroundColor: '#bf3131',
        borderTop: '1px solid black',
        padding: '0.2vh'
      };
      let typeSelectedStyleShow = {
        display: 'block',
        float: 'left',
        width: '100%',
        backgroundColor: '#61ab3b',
        borderTop: '1px solid black',
        padding: '0.2vh'
      };
      let parts = [];
      for (let i = 0, len = partList.length; i < len; i++) {
        let selected = this.checkSelected(part, section, i);
        let style = selected === null ? typeStyle : selected.hide ? typeSelectedStyle : typeSelectedStyleShow;
        let selectedName = selected === null ? '(none)' : selected.hide ? '(hide)' : '(show)';
        let coords = [Math.floor(partList[i].x / width).toString(), Math.floor(partList[i].y / height).toString()].join(' x ');
        let name = ['Map:', partList[i].map, 'name:', partList[i].name, 'coords:', coords, selectedName].join(' ');
        let key = ['select-option-part', section, part, name].join('-');
        let partElement = (0, dom.element)("div", {
          style: style,
          onClick: e => this.changePart(e, part, section, i),
          children: name
        }, key);
        parts.push(partElement);
      }
      let key = ['select-part', section, part].join('-');
      let className = ['section', 'part'].join('-');
      let classNameHeader = ['section', 'part', 'header'].join('-');
      return (0, dom.element)("div", {
        className: className,
        children: [(0, dom.element)("div", {
          className: classNameHeader,
          children: part
        }), parts]
      }, key);
    }
    procedPlace(e) {
      e.preventDefault();
      let newState = Object.assign({}, this.state);
      let sectionNames = ['finished'];
      for (let index in sectionNames) {
        let section = sectionNames[index];
        let trigger = null;
        let selected = null;
        switch (section) {
          case 'finished':
            trigger = newState.itemSelected.trigger;
            selected = newState.selected.finished;
            break;
        }
        let partNames = ['exit', 'items', 'enemy', 'environment', 'quest', 'experience'];
        for (let indexPart in partNames) {
          let part = partNames[indexPart];
          if (part === 'experience') {
            trigger.experience = selected.experience;
            continue;
          }
          let partList = [];
          let triggerPart = [];
          switch (part) {
            case 'exit':
              if (this.props.id !== null) trigger.exit = [];
              partList = newState.exit;
              triggerPart = trigger.exit;
              break;
            case 'items':
              if (this.props.id !== null) trigger.items = [];
              partList = newState.items;
              triggerPart = trigger.items;
              break;
            case 'enemy':
              if (this.props.id !== null) trigger.enemy = [];
              partList = newState.enemy;
              triggerPart = trigger.enemy;
              break;
            case 'environment':
              if (this.props.id !== null) trigger.environment = [];
              partList = newState.environment;
              triggerPart = trigger.environment;
              break;
            case 'quest':
              if (this.props.id !== null) trigger.quests = [];
              partList = newState.quests;
              triggerPart = trigger.quest;
              break;
          }
          for (let i = 0, len = partList.length; i < len; i++) {
            let selectedItem = this.checkSelected(part, section, i);
            if (selectedItem === null) continue;
            let item = Object.assign({}, partList[selectedItem.index]);
            item.hide = selectedItem.hide;
            triggerPart.push(item);
          }
        }
      }
      for (let i in newState.types) {
        if (newState.types[i].name !== newState.itemSelected.name) continue;
        newState.itemSelected.properties = Object.assign({}, newState.types[i].properties);
        break;
      }
      this.props.onProced(newState.itemSelected);
    }
    changeSpeed(e) {
      e.preventDefault();
      let newState = Object.assign({}, this.state);
      let newSpeed = parseInt(e.target.value);
      if (newSpeed > 0 && newSpeed <= 10) {
        newState.quest.speed = newSpeed;
        this.setState(newState);
      }
    }
    changeType(e) {
      e.preventDefault();
      let newState = Object.assign({}, this.state);
      newState.itemSelected.name = e.target.value;
      this.setState(newState);
    }
    createTexts() {
      let partsNames = ['title', 'finished'];
      let newState = Object.assign({}, this.state);
      let texts = newState.itemSelected.text;
      let parts = [];
      for (let i = 0, len = partsNames.length; i < len; i++) {
        let classNameHeader = ['text', 'section', 'part', 'header'].join('-');
        let text = '';
        switch (partsNames[i]) {
          case 'title':
            text = texts.title;
            break;
          case 'finished':
            text = texts.finished;
            break;
        }
        let key = ['text', 'section', partsNames[i]].join('-');
        let className = ['text', 'section', 'part'].join('-');
        let part = (0, dom.element)("div", {
          className: className,
          children: [(0, dom.element)("div", {
            className: classNameHeader,
            children: partsNames[i]
          }), (0, dom.element)("textarea", {
            onChange: e => this.changeText(e, partsNames[i]),
            value: text
          })]
        }, key);
        parts.push(part);
      }
      let key = ['text-section'].join('-');
      let className = ['text', 'section'].join('-');
      let classNameHeader = ['text', 'section', 'header'].join('-');
      return (0, dom.element)("div", {
        className: className,
        children: [(0, dom.element)("div", {
          className: classNameHeader,
          children: "Texts"
        }), parts]
      }, key);
    }
    createTypes() {
      let options = [];
      let types = [];
      for (let i = 0, len = this.state.types.length; i < len; i++) {
        let classNameHeader = ['text', 'section', 'part', 'header'].join('-');
        let text = '';
        let type = this.state.types[i];
        let key = ['type', 'section', type.name].join('-');
        let option = (0, dom.element)("option", {
          value: type.name.toString(),
          children: [type.name].join(' ')
        }, key);
        options.push(option);
      }
      let key = ['type', 'section', 'types'].join('-');
      let className = ['type', 'section'].join('-');
      let classNameHeader = ['type', 'section', 'header'].join('-');
      let part = (0, dom.element)("div", {
        className: className,
        children: [(0, dom.element)("div", {
          className: classNameHeader,
          children: "Type"
        }), (0, dom.element)("select", {
          value: this.state.itemSelected.name,
          onChange: e => this.changeType(e),
          children: options
        })]
      }, key);
      return part;
    }
    render() {
      let selectFinished = this.createSection('finished');
      let selectTypes = this.createTypes();
      let texts = this.createTexts();
      let style = {
        position: 'absolute',
        marginLeft: '4vw',
        width: '92vw',
        marginTop: '1vh',
        minHeight: '93vh',
        backgroundColor: '#603abb',
        border: '1px solid black',
        padding: '0.5vh 1vh',
        borderRadius: '2vh'
      };
      let popupVisibleStyle = {
        display: 'block',
        float: 'left',
        width: '100%',
        backgroundColor: '#9c8383',
        borderTop: '1px solid black',
        padding: '0.5vh'
      };
      let className = 'quest-popup';
      let classNameSections = 'sections';
      let textVisible = this.state.itemSelected.visible ? 'visible' : 'invisible';
      let classNameVisible = 'toggle-visible';
      let elementVisible = (0, dom.element)("div", {
        style: popupVisibleStyle,
        className: classNameVisible,
        onClick: e => this.toggleVisible(e),
        children: textVisible
      });
      let headerName = this.props.id !== null ? 'Update Item' : 'New Item';
      return (0, dom.element)("div", {
        style: style,
        className: className,
        children: [(0, dom.element)("h2", {
          children: headerName
        }), (0, dom.element)("div", {
          className: "visible",
          children: ["Visibility: ", elementVisible]
        }), (0, dom.element)("div", {
          className: "type",
          children: ["Type: ", selectTypes]
        }), (0, dom.element)("div", {
          className: classNameSections,
          children: [selectFinished, texts]
        }), (0, dom.element)("div", {
          className: "buttons",
          children: [(0, dom.element)("div", {
            onClick: e => this.procedPlace(e),
            children: "PLACE"
          }), (0, dom.element)("div", {
            onClick: e => this.props.onCancel(),
            children: "CANCEL"
          })]
        })]
      });
    }
  }
  exports.default = EditorMapQuestAdd;
});

