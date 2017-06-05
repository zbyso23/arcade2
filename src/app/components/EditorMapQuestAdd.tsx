import * as React from 'react';
import { 
    IStore, 
    IStoreContext, 
    IGameWorldQuestTriggerPartState,
    IGameMapState, 
    IGameMapPlatformState, 
    IGameMapStarState, 
    IGameMapSpikeState, 
    IGameMapQuestState,
    IPlayerState,

} from '../reducers';
import { getDefaultQuestState } from '../reducers/gameMapReducer';
import { Store } from 'redux';
import { Sprites, ISprite, ISpriteBlock } from '../libs/Sprites';
import { Environment, IEnvironment, IEnvironmentBlock } from '../libs/Environment';

import { 
    PLAYER_UPDATE, 
    PLAYER_CLEAR,
    PLAYER_ADD_EXPERIENCE,
    PLAYER_ADD_STAR
} from '../actions/playerActions';
import { 
    GAME_MAP_UPDATE,
    GAME_MAP_EXPORT,
    GAME_MAP_IMPORT
} from '../actions/gameMapActions';

import { 
    GAME_WORLD_MAP_UPDATE,
    GAME_WORLD_MAP_SWITCH,
    GAME_WORLD_MAP_START_SET,
    GAME_WORLD_PLAYER_UPDATE,
    GAME_WORLD_EXPORT,
    GAME_WORLD_IMPORT
} from '../actions/gameWorldActions';


export interface IEditorMapQuestAddProps {
    onProced?: (quest: IGameMapQuestState) => any;
    onCancel?: () => any;
}

export interface IEditorMapQuestSelectedAddPartState
{
    index: number;
    hide: boolean;
}

export interface IEditorMapQuestSelectedAddState
{
    accepted: {
        experience: number;
        exit: Array<IEditorMapQuestSelectedAddPartState>;
        items: Array<IEditorMapQuestSelectedAddPartState>;
        environment: Array<IEditorMapQuestSelectedAddPartState>;
        enemy: Array<IEditorMapQuestSelectedAddPartState>;
        quest: Array<IEditorMapQuestSelectedAddPartState>;
    };
    rejected: {
        experience: number;
        exit: Array<IEditorMapQuestSelectedAddPartState>;
        items: Array<IEditorMapQuestSelectedAddPartState>;
        environment: Array<IEditorMapQuestSelectedAddPartState>;
        enemy: Array<IEditorMapQuestSelectedAddPartState>;
        quest: Array<IEditorMapQuestSelectedAddPartState>;
    };
    finished: {
        experience: number;
        exit: Array<IEditorMapQuestSelectedAddPartState>;
        items: Array<IEditorMapQuestSelectedAddPartState>;
        environment: Array<IEditorMapQuestSelectedAddPartState>;
        enemy: Array<IEditorMapQuestSelectedAddPartState>;
        quest: Array<IEditorMapQuestSelectedAddPartState>;
    };
    acceptedCondition: {
        items: Array<IEditorMapQuestSelectedAddPartState>;
        enemy: Array<IEditorMapQuestSelectedAddPartState>;
    };
}

export interface IEditorMapQuestAddState 
{
    quest: IGameMapQuestState;
    exit: Array<IGameWorldQuestTriggerPartState>;
    items: Array<IGameWorldQuestTriggerPartState>;
    environment: Array<IGameWorldQuestTriggerPartState>;
    enemy: Array<IGameWorldQuestTriggerPartState>;
    quests: Array<IGameWorldQuestTriggerPartState>;
    selected: IEditorMapQuestSelectedAddState
}


function mapStateFromStore(store: IStore, state: IEditorMapQuestAddState): IEditorMapQuestAddState {
    let newState = Object.assign({}, state);
    return newState;
}

export default class EditorMapQuestAdd extends React.Component<IEditorMapQuestAddProps, IEditorMapQuestAddState> {

    static contextTypes: React.ValidationMap<any> = 
    {
        store: React.PropTypes.object
    }
    
    context: IStoreContext;
    unsubscribe: Function;

    constructor(props: IEditorMapQuestAddProps) {
        super(props);
        this.state = {
            quest: getDefaultQuestState(),
            exit: [],
            items: [],
            environment: [],
            enemy: [],
            quests: [],
            selected: {
                accepted: {
                    experience: 0,
                    exit: [],
                    items: [],
                    environment: [],
                    enemy: [],
                    quest: []
                },
                rejected: {
                    experience: 0,
                    exit: [],
                    items: [],
                    environment: [],
                    enemy: [],
                    quest: []
                },
                finished: {
                    experience: 0,
                    exit: [],
                    items: [],
                    environment: [],
                    enemy: [],
                    quest: []
                },
                acceptedCondition: {
                    items: [],
                    enemy: []
                }
            }
        };

        this.changeText = this.changeText.bind(this);
        this.toggleVisible = this.toggleVisible.bind(this);
        this.changeExperience = this.changeExperience.bind(this);
        this.changeSpeed = this.changeSpeed.bind(this);
    }

    componentDidMount() 
    {
        let storeState = this.context.store.getState();
        let newState = Object.assign({}, this.state);
        let exit: Array<IGameWorldQuestTriggerPartState> = [];
        let items: Array<IGameWorldQuestTriggerPartState> = [];
        let environment: Array<IGameWorldQuestTriggerPartState> = [];
        let enemy: Array<IGameWorldQuestTriggerPartState> = [];
        let quests: Array<IGameWorldQuestTriggerPartState> = [];
        for(let i in storeState.world.maps)
        {
            let mapName = i;
            let map = storeState.world.maps[i];
            for(let i = 0, len = map.exit.length; i < len; i++)
            {
                exit.push({map: mapName, x: map.exit[i].x, y: map.exit[i].y, name: map.exit[i].type.name, hide: !map.exit[i].visible });
            }
            for(let i = 0, len = map.items.length; i < len; i++)
            {
                items.push({map: mapName, x: map.items[i].x, y: map.items[i].y, name: map.items[i].name, hide: !map.items[i].visible });
            }
            for(let i = 0, len = map.environment.length; i < len; i++)
            {
                environment.push({map: mapName, x: map.environment[i].x, y: map.environment[i].y, name: map.environment[i].name, hide: !map.environment[i].visible });
            }
            for(let i = 0, len = map.enemies.length; i < len; i++)
            {
                enemy.push({map: mapName, x: map.enemies[i].x, y: map.enemies[i].height, name: map.enemies[i].type, hide: !map.enemies[i].visible });
            }
            for(let i = 0, len = map.quests.length; i < len; i++)
            {
                quests.push({map: mapName, x: map.quests[i].x, y: map.quests[i].y, name: map.quests[i].name, hide: !map.quests[i].visible });
            }
        }
        newState.exit = exit;
        newState.items = items;
        newState.environment = environment;
        newState.enemy = enemy;
        newState.quests = quests;
        newState.visible = true;
        newState.quest.speed = 2;
        this.setState(newState);
    }

    componentWillUnmount() 
    {
    }

    checkSelected(part: string, section: string, index: number): any
    {
        if(['exit', 'items', 'enemy', 'environment', 'quest'].indexOf(part) === -1) return null;
        if(['acceptedCondition', 'accepted', 'rejected', 'finished'].indexOf(section) === -1) return null;
        let selected: any = null;
        switch(section)
        {
            case 'accepted':
                selected = this.state.selected.accepted;
                break;

            case 'rejected':
                selected = this.state.selected.rejected;
                break;

            case 'finished':
                selected = this.state.selected.finished;
                break;

            case 'acceptedCondition':
                selected = this.state.selected.acceptedCondition;
                break;
        }

        let selectedList: Array<IEditorMapQuestSelectedAddPartState>;
        switch(part)
        {
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
        for(let i = 0, len = selectedList.length; i < len; i++)
        {
           if(selectedList[i].index !== index) continue;
           return selectedList[i];
        }
        return null;
    }

    changePart(e: any, part: string, section: string, index: number): any
    {
        e.preventDefault();
        console.log('changePart', part, section, index, e.shiftKey);
        let newState = Object.assign({}, this.state);
        let selected: any = null;
        switch(section)
        {
            case 'accepted':
                selected = newState.selected.accepted;
                break;

            case 'rejected':
                selected = newState.selected.rejected;
                break;

            case 'finished':
                selected = newState.selected.finished;
                break;

            case 'acceptedCondition':
                selected = newState.selected.acceptedCondition;
                break;

        }
console.log('change part', part, section, index, selected, newState.selected)
        let selectedList: Array<IEditorMapQuestSelectedAddPartState>;
        switch(part)
        {
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
        let partList: Array<IGameWorldQuestTriggerPartState>;
        switch(part)
        {
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
        for(let i = 0, len = partList.length; i < len; i++)
        {
            if(i !== index) continue;
            selectedItem = this.checkSelected(part, section, i);
            partItem = partList[i];
        }
        if(partItem === null) return;
        if(selectedItem === null)
        {
            let defaultState = (section === 'acceptedCondition') ? true : false;
            selectedList.push({index: index, hide: defaultState});
        }
        else
        {
            let newSelectedList: Array<IEditorMapQuestSelectedAddPartState> = [];
            let removeIndex = -1;
            for(let i = 0, len = selectedList.length; i < len; i++)
            {
                if(selectedList[i].index !== index) continue;
                if(section !== 'acceptedCondition' && false === selectedItem.hide)
                {
                    selectedList[i].hide = true;
                    continue;
                }
                removeIndex = i;
            }
            if(removeIndex >= 0) selectedList.splice(removeIndex, 1);
        }
        this.setState(newState);
    }

    changeText(e: any, section: string)
    {
        e.preventDefault();
        let sectionNames = ['title', 'introduction', 'accepted', 'rejected', 'progress', 'finished'];
        if(sectionNames.indexOf(section) === -1) return;
        let newState = Object.assign({}, this.state);
        switch(section)
        {
            case 'title':
                newState.quest.quest.title = e.target.value;
                break;
            case 'introduction':
                newState.quest.quest.text.introduction = e.target.value;
                break;
            case 'accepted':
                newState.quest.quest.text.accepted = e.target.value;
                break;
            case 'rejected':
                newState.quest.quest.text.rejected = e.target.value;
                break;
            case 'progress':
                newState.quest.quest.text.progress = e.target.value;
                break;
            case 'finished':
                newState.quest.quest.text.finished = e.target.value;
                break;
        }
        this.setState(newState);
    }

    changeExperience(e: any, section: string)
    {
        e.preventDefault();
        let value = parseInt(e.target.value);
        if(value < 0) return;
        let newState = Object.assign({}, this.state);
        switch(section)
        {
            case 'accepted':
                newState.selected.accepted.experience = value;
                break;

            case 'rejected':
                newState.selected.rejected.experience = value;
                break;

            case 'finished':
                newState.selected.finished.experience = value;
                break;
        }
        this.setState(newState);
    }

    toggleVisible(e: any)
    {
        e.preventDefault();
        let newState = Object.assign({}, this.state);
        newState.quest.visible = !newState.quest.visible;
        this.setState(newState);
    }

    createSection(section: string): any
    {
        if(['acceptedCondition', 'accepted', 'rejected', 'finished'].indexOf(section) === -1) return null;
        let newState = Object.assign({}, this.state);
        let partsNames = ['exit', 'items', 'enemy', 'environment', 'quest'];
        let parts: Array<any> = [];
        for(let i = 0, len = partsNames.length; i < len; i++)
        {
            let part = this.createPart(partsNames[i], section);
            parts.push(part)
        }
        let name = 'experience';
        let key = ['select-part', section, 'experience'].join('-');
        let text = '';
        switch(section)
        {
            case 'accepted':
                text = newState.selected.accepted.experience.toString();
                break;

            case 'rejected':
                text = newState.selected.rejected.experience.toString();
                break;

            case 'finished':
                text = newState.selected.finished.experience.toString();
                break;
        }
        let style = { display: 'block', float: 'left', width: '100%', backgroundColor: '#f5b1b1', borderTop: '1px solid black', padding: '0.2vh' };
        let part = <div key={key} style={style}>{name}<input onChange={(e) => this.changeExperience(e, section)} value={text} /></div>;
        parts.push(part)

        key = ['select-section', section].join('-');
        let className = ['section'].join('-');
        let classNameHeader = ['section', 'header'].join('-');
        return <div key={key} className={className}>
                    <div className={classNameHeader}>{section}</div>
                    {parts}
                </div>;
    }

    createSectionAcceptCondition(): any
    {
        let section = 'acceptedCondition';
        let newState = Object.assign({}, this.state);

        let partsNames = ['items', 'enemy'];
        let parts: Array<any> = [];
        for(let i = 0, len = partsNames.length; i < len; i++)
        {
            let part = this.createPart(partsNames[i], section);
            parts.push(part)
        }
        let key = ['select-section', section].join('-');
        let className = ['section'].join('-');
        let classNameHeader = ['section', 'header'].join('-');
        return <div key={key} className={className}>
                    <div className={classNameHeader}>{section}</div>
                    {parts}
                </div>;
    }

    createPart(part: string, section: string): any
    {
let width = 92;
let height = 104;
        if(['exit', 'items', 'enemy', 'environment', 'quest'].indexOf(part) === -1) return null;
        if(['acceptedCondition', 'accepted', 'rejected', 'finished'].indexOf(section) === -1) return null;
        let partList: Array<IGameWorldQuestTriggerPartState>;
        switch(part)
        {
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

        let typeStyle = { display: 'block', float: 'left', width: '100%', backgroundColor: '#a5b1b1', borderTop: '1px solid black', padding: '0.2vh' };
        let typeSelectedStyle = { display: 'block', float: 'left', width: '100%', backgroundColor: '#bf3131', borderTop: '1px solid black', padding: '0.2vh' };
        let typeSelectedStyleShow = { display: 'block', float: 'left', width: '100%', backgroundColor: '#61ab3b', borderTop: '1px solid black', padding: '0.2vh' };

        let parts: Array<any> = [];
        for(let i = 0, len = partList.length; i < len; i++)
        {
            let selected = this.checkSelected(part, section, i);
            let style = (selected === null) ? typeStyle : ((selected.hide) ? typeSelectedStyle : typeSelectedStyleShow);
            let selectedName = (selected === null) ? '(none)' : ((selected.hide) ? '(hide)' : '(show)');
            let coords = [Math.floor(partList[i].x / width).toString(), Math.floor(partList[i].y / height).toString()].join(' x ');
            let name = ['Map:', partList[i].map, 'name:', partList[i].name, 'coords:', coords, selectedName].join(' ');
            let key = ['select-option-part', section, part, name].join('-');
            let partElement = <div key={key} style={style} onClick={(e) => this.changePart(e, part, section, i)}>{name}</div>
            parts.push(partElement);
        }
        let key = ['select-part', section, part].join('-');
        let className = ['section', 'part'].join('-');
        let classNameHeader = ['section', 'part', 'header'].join('-');
        return <div key={key} className={className}>
                    <div className={classNameHeader}>{part}</div>
                    {parts}
                </div>;
    }

    procedPlace(e: any)
    {
        e.preventDefault();
        let newState = Object.assign({}, this.state);
        console.log('place', this.state);
        let sectionNames = ['acceptedCondition', 'accepted', 'rejected', 'finished'];
        for(let index in sectionNames)
        {
            let section = sectionNames[index];
            let trigger: any = null;
            let selected: any = null;
            switch(section)
            {
                case 'accepted':
                    trigger = newState.quest.quest.trigger.accepted;
                    selected = newState.selected.accepted;
                    break;

                case 'rejected':
                    trigger = newState.quest.quest.trigger.rejected;
                    selected = newState.selected.rejected;
                    break;

                case 'finished':
                    trigger = newState.quest.quest.trigger.finished;
                    selected = newState.selected.finished;
                    break;

                case 'acceptedCondition':
                    trigger = newState.quest.quest.accept;
                    selected = newState.selected.acceptedCondition;
                    break;
            }

            let partNames = (section === 'acceptedCondition') ? ['items', 'enemy'] : ['exit', 'items', 'enemy', 'environment', 'quest', 'experience'];
            for(let indexPart in partNames)
            {
                let part = partNames[indexPart];
                let partList: Array<IGameWorldQuestTriggerPartState> = [];
                let triggerPart: any = null;
                switch(part)
                {
                    case 'exit':
                        partList = newState.exit;
                        triggerPart = trigger.exit;
                        break;

                    case 'items':
                        partList = newState.items;
                        triggerPart = trigger.items;
                        break;

                    case 'enemy':
                        partList = newState.enemy;
                        triggerPart = trigger.enemy;
                        break;

                    case 'environment':
                        partList = newState.environment;
                        triggerPart = trigger.environment;
                        break;

                    case 'quest':
                        partList = newState.quests;
                        triggerPart = trigger.quest;
                        break;

                    case 'experience':
                        trigger.experience = selected.experience;
                        break;
                }

                for(let i = 0, len = partList.length; i < len; i++)
                {
                    let selectedItem = this.checkSelected(part, section, i);
                    if(selectedItem === null) continue;
                    let item = Object.assign({}, partList[selectedItem.index]);
                    item.hide = selectedItem.hide;
                    triggerPart.push(item);
                    console.log('item', section, part, selectedItem, item);
                    console.log('section part selectedItem', section, part, selectedItem);
                }
            }
        }
        console.log('state newState', newState);
        this.props.onProced(newState.quest);
    // map: string;
    // name: string;
    // x: number;
    // y: number;
    // hide: boolean;
        //this.props.onProced()
    }

    changeSpeed(e: any)
    {
        e.preventDefault();
        let newState = Object.assign({}, this.state);
        let newSpeed = parseInt(e.target.value);
        if(newSpeed > 0 && newSpeed <= 10)
        {
            newState.quest.speed = newSpeed;
            this.setState(newState);
        }
    }

    createTexts(): any
    {
        
        let partsNames = ['title', 'introduction', 'accepted', 'rejected', 'progress', 'finished'];
        let newState = Object.assign({}, this.state);
        let texts = newState.quest.quest.text;
        let parts: Array<any> = [];
        for(let i = 0, len = partsNames.length; i < len; i++)
        {
            let classNameHeader = ['text', 'section', 'part', 'header'].join('-');
            let text = '';
            switch(partsNames[i])
            {
                case 'title':
                    text = newState.quest.quest.title;
                    break;
                case 'introduction':
                    text = texts.introduction;
                    break;
                case 'introduction':
                    text = texts.introduction;
                    break;
                case 'accepted':
                    text = texts.accepted;
                    break;
                case 'rejected':
                    text = texts.rejected;
                    break;
                case 'progress':
                    text = texts.progress;
                    break;
                case 'finished':
                    text = texts.finished;
                    break;
            }
            let key = ['text', 'section', partsNames[i]].join('-');
            let className = ['text', 'section', 'part'].join('-');
            let part = <div key={key} className={className}><div className={classNameHeader}>{partsNames[i]}</div><textarea onChange={(e) => this.changeText(e, partsNames[i])} value={text} /></div>
            parts.push(part)
        }
        let key = ['text-section'].join('-');
        let className = ['text', 'section'].join('-');
        let classNameHeader = ['text', 'section', 'header'].join('-');
        return <div key={key} className={className}>
                    <div className={classNameHeader}>Texts</div>
                    {parts}
                </div>;
    }

    render()
    {
        let selectAccepted = this.createSection('accepted');
        let selectRejected = this.createSection('rejected');
        let selectFinished = this.createSection('finished');
        let selectAcceptCondition = this.createSectionAcceptCondition();
        let texts = this.createTexts();
        let style = { position: 'absolute', marginLeft: '4vw', width: '92vw', marginTop: '1vh', minHeight: '93vh', backgroundColor: '#603abb', border: '1px solid black', padding: '0.5vh 1vh', borderRadius: '2vh' };
        let popupVisibleStyle = { display: 'block', float: 'left', width: '100%', backgroundColor: '#9c8383', borderTop: '1px solid black', padding: '0.5vh' };
        let className = 'quest-popup';
        let classNameSections = 'sections';
        let textVisible = (this.state.quest.visible) ? 'visible' : 'invisible';
        let classNameVisible = 'toggle-visible';
        let itemSpeedName = this.state.quest.speed.toString();
        let elementVisible = <div style={popupVisibleStyle} className={classNameVisible} onClick={(e) => this.toggleVisible(e)}>{textVisible}</div>;
        let elementSetSpeed = <input style={popupVisibleStyle} onChange={(e) => this.changeSpeed(e)} value={itemSpeedName} />;
        return <div style={style} className={className}>QUEST<div className="visible">{elementVisible}</div><div className="speed">{elementSetSpeed}</div><div className={classNameSections}>
            {selectAccepted}
            {selectRejected}
            {selectFinished}
            {selectAcceptCondition}
            {texts}
        </div><div onClick={(e) => this.procedPlace(e)}>PLACE</div><div onClick={(e) => this.props.onCancel()}>CANCEL</div></div>;
    }
}
