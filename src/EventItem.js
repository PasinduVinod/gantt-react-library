import React, {Component, useState, useRef, useEffect} from 'react'
import {PropTypes} from 'prop-types'
import Popover from 'antd/lib/popover'
import 'antd/lib/popover/style/index.css'
import EventItemPopover from './EventItemPopover'
import {CellUnits, DATETIME_FORMAT} from './index'
import {DnDTypes} from './DnDTypes'
const supportTouch = 'ontouchstart' in window;
import { durationAfterDeadline, durationBeforeDeadline, totalDuration } from '../example/Basic'
import Title from 'antd/lib/skeleton/Title'

class EventItem extends Component {
    constructor(props) {
        super(props);

        const {left, top, width} = props;
        this.state = {
            left: left,
            top: top,
            width: width,
        };
        this.startResizer = null;
        this.endResizer = null;
    }

    static propTypes = {
        schedulerData: PropTypes.object.isRequired,
        eventItem: PropTypes.object.isRequired,
        isStart: PropTypes.bool.isRequired,
        isEnd: PropTypes.bool.isRequired,
        left: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        top: PropTypes.number.isRequired,
        isInPopover: PropTypes.bool.isRequired,
        leftIndex: PropTypes.number.isRequired,
        rightIndex: PropTypes.number.isRequired,
        isDragging: PropTypes.bool.isRequired,
        connectDragSource: PropTypes.func.isRequired,
        connectDragPreview: PropTypes.func.isRequired,
        updateEventStart: PropTypes.func,
        updateEventEnd: PropTypes.func,
        moveEvent: PropTypes.func,
        subtitleGetter: PropTypes.func,
        eventItemClick: PropTypes.func,
        viewEventClick: PropTypes.func,
        viewEventText: PropTypes.string,
        viewEvent2Click: PropTypes.func,
        viewEvent2Text: PropTypes.string,
        conflictOccurred: PropTypes.func,
        eventItemTemplateResolver: PropTypes.func,
    }

    UNSAFE_componentWillReceiveProps(np) {
        const {left, top, width} = np;
        this.setState({
            left: left,
            top: top,
            width: width,
        });

        this.subscribeResizeEvent(np);
    }

    componentDidMount() {
        this.subscribeResizeEvent(this.props);
    }

    initStartDrag = (ev) => {
        const {schedulerData, eventItem} = this.props;
        let slotId = schedulerData._getEventSlotId(eventItem);
        let slot = schedulerData.getSlotById(slotId);
        if(!!slot && !!slot.groupOnly) return;
        if(schedulerData._isResizing()) return;

        ev.stopPropagation();
        let clientX = 0;
        if(supportTouch) {
            if(ev.changedTouches.length == 0) return;
            const touch = ev.changedTouches[0];
            clientX = touch.pageX;
        } else {
            if (ev.buttons !== undefined && ev.buttons !== 1) return;
            clientX = ev.clientX;
        }
        this.setState({
            startX: clientX
        });
        schedulerData._startResizing();
        if(supportTouch) {
            this.startResizer.addEventListener('touchmove', this.doStartDrag, false);
            this.startResizer.addEventListener('touchend', this.stopStartDrag, false);
            this.startResizer.addEventListener('touchcancel', this.cancelStartDrag, false);
        } else {
            document.documentElement.addEventListener('mousemove', this.doStartDrag, false);
            document.documentElement.addEventListener('mouseup', this.stopStartDrag, false);
        }
        document.onselectstart = function () {
			return false;
		};
		document.ondragstart = function () {
			return false;
		};
    }

    doStartDrag = (ev) => {
        ev.stopPropagation();

        let clientX = 0;
        if(supportTouch) {
            if(ev.changedTouches.length == 0) return;
            const touch = ev.changedTouches[0];
            clientX = touch.pageX;
        } else {
            clientX = ev.clientX;
        }
        const {left, width, leftIndex, rightIndex, schedulerData} = this.props;
        let cellWidth = schedulerData.getContentCellWidth();
        let offset = leftIndex > 0 ? 5 : 6;
        let minWidth = cellWidth - offset;
        let maxWidth = rightIndex * cellWidth - offset;
        const {startX} = this.state;
        let newLeft = left + clientX - startX;
        let newWidth = width + startX - clientX;
        if (newWidth < minWidth) {
            newWidth = minWidth;
            newLeft = (rightIndex - 1) * cellWidth + (rightIndex - 1 > 0 ? 2 : 3);
        }
        else if (newWidth > maxWidth) {
            newWidth = maxWidth;
            newLeft = 3;
        }

        this.setState({left: newLeft, width: newWidth});
    }

    stopStartDrag = (ev) => {
        ev.stopPropagation();
        if(supportTouch) {
            this.startResizer.removeEventListener('touchmove', this.doStartDrag, false);
            this.startResizer.removeEventListener('touchend', this.stopStartDrag, false);
            this.startResizer.removeEventListener('touchcancel', this.cancelStartDrag, false);
        } else {
            document.documentElement.removeEventListener('mousemove', this.doStartDrag, false);
            document.documentElement.removeEventListener('mouseup', this.stopStartDrag, false);
        }
        document.onselectstart = null;
        document.ondragstart = null;
        const {width, left, top, leftIndex, rightIndex, schedulerData, eventItem, updateEventStart, conflictOccurred} = this.props;
        schedulerData._stopResizing();
        if(this.state.width === width) return;

        let clientX = 0;
        if(supportTouch) {
            if(ev.changedTouches.length == 0) {
                this.setState({
                    left: left,
                    top: top,
                    width: width,
                });
                return;
            }
            const touch = ev.changedTouches[0];
            clientX = touch.pageX;
        } else {
            clientX = ev.clientX;
        }
        const {cellUnit, events, config, localeMoment} = schedulerData;
        let cellWidth = schedulerData.getContentCellWidth();
        let offset = leftIndex > 0 ? 5 : 6;
        let minWidth = cellWidth - offset;
        let maxWidth = rightIndex * cellWidth - offset;
        const {startX} = this.state;
        let newWidth = width + startX - clientX;
        let deltaX = clientX - startX;
        let sign = deltaX < 0 ? -1 : (deltaX === 0 ? 0 : 1);
        let count = (sign > 0 ? Math.floor(Math.abs(deltaX) / cellWidth) : Math.ceil(Math.abs(deltaX) / cellWidth)) * sign;
        if (newWidth < minWidth)
            count = rightIndex - leftIndex - 1;
        else if (newWidth > maxWidth)
            count = -leftIndex;
        let newStart = localeMoment(eventItem.start).add(cellUnit === CellUnits.Hour ? count * config.minuteStep : count, cellUnit === CellUnits.Hour ? 'minutes' : 'days').format(DATETIME_FORMAT);
        if(count !== 0 && cellUnit !== CellUnits.Hour && config.displayWeekend === false) {
            if(count > 0) {
                let tempCount = 0, i = 0;
                while (true) {
                    i++;
                    let tempStart = localeMoment(eventItem.start).add(i, 'days');
                    let dayOfWeek = tempStart.weekday();
                    if(dayOfWeek !== 0 && dayOfWeek !== 6) {
                        tempCount ++;
                        if(tempCount === count) {
                            newStart = tempStart.format(DATETIME_FORMAT);
                            break;
                        }
                    }

                }
            } else {
                let tempCount = 0, i = 0;
                while (true) {
                    i--;
                    let tempStart = localeMoment(eventItem.start).add(i, 'days');
                    let dayOfWeek = tempStart.weekday();
                    if(dayOfWeek !== 0 && dayOfWeek !== 6) {
                        tempCount --;
                        if(tempCount === count) {
                            newStart = tempStart.format(DATETIME_FORMAT);
                            break;
                        }
                    }
                }
            }
        }

        let hasConflict = false;
        let slotId = schedulerData._getEventSlotId(eventItem);
        let slotName = undefined;
        let slot = schedulerData.getSlotById(slotId);
        if(!!slot)
            slotName = slot.name;
        if (config.checkConflict) {
            let start = localeMoment(newStart),
                end = localeMoment(eventItem.end);

            events.forEach((e) => {
                if (schedulerData._getEventSlotId(e) === slotId && e.id !== eventItem.id) {
                    let eStart = localeMoment(e.start),
                        eEnd = localeMoment(e.end);
                    if ((start >= eStart && start < eEnd) || (end > eStart && end <= eEnd) || (eStart >= start && eStart < end) || (eEnd > start && eEnd <= end))
                        hasConflict = true;
                }
            });
        }

        if (hasConflict) {
            this.setState({
                left: left,
                top: top,
                width: width,
            });

            if (conflictOccurred != undefined) {
                conflictOccurred(schedulerData, 'StartResize', eventItem, DnDTypes.EVENT, slotId, slotName, newStart, eventItem.end);
            }
            else {
                console.log('Conflict occurred, set conflictOccurred func in Scheduler to handle it');
            }
            this.subscribeResizeEvent(this.props);
        }
        else {
            if (updateEventStart != undefined)
                updateEventStart(schedulerData, eventItem, newStart);
        }
    }

    cancelStartDrag = (ev) => {
        ev.stopPropagation();

        this.startResizer.removeEventListener('touchmove', this.doStartDrag, false);
        this.startResizer.removeEventListener('touchend', this.stopStartDrag, false);
        this.startResizer.removeEventListener('touchcancel', this.cancelStartDrag, false);
        document.onselectstart = null;
        document.ondragstart = null;
        const {schedulerData, left, top, width} = this.props;
        schedulerData._stopResizing();
        this.setState({
            left: left,
            top: top,
            width: width,
        });
    }

    initEndDrag = (ev) => {
        const {schedulerData, eventItem} = this.props;
        let slotId = schedulerData._getEventSlotId(eventItem);
        let slot = schedulerData.getSlotById(slotId);
        if(!!slot && !!slot.groupOnly) return;
        if(schedulerData._isResizing()) return;

        ev.stopPropagation();
        let clientX = 0;
        if(supportTouch) {
            if(ev.changedTouches.length == 0) return;
            const touch = ev.changedTouches[0];
            clientX = touch.pageX;
        } else {
            if (ev.buttons !== undefined && ev.buttons !== 1) return;
            clientX = ev.clientX;
        }
        this.setState({
            endX: clientX
        });

        schedulerData._startResizing();
        if(supportTouch) {
            this.endResizer.addEventListener('touchmove', this.doEndDrag, false);
            this.endResizer.addEventListener('touchend', this.stopEndDrag, false);
            this.endResizer.addEventListener('touchcancel', this.cancelEndDrag, false);
        } else {
            document.documentElement.addEventListener('mousemove', this.doEndDrag, false);
            document.documentElement.addEventListener('mouseup', this.stopEndDrag, false);
        }
        document.onselectstart = function () {
			return false;
		};
		document.ondragstart = function () {
			return false;
		};
    }

    doEndDrag = (ev) => {
        ev.stopPropagation();
        let clientX = 0;
        if(supportTouch) {
            if(ev.changedTouches.length == 0) return;
            const touch = ev.changedTouches[0];
            clientX = touch.pageX;
        } else {
            clientX = ev.clientX;
        }
        const {width, leftIndex, schedulerData} = this.props;
        const {headers} = schedulerData;
        let cellWidth = schedulerData.getContentCellWidth();
        let offset = leftIndex > 0 ? 5 : 6;
        let minWidth = cellWidth - offset;
        let maxWidth = (headers.length - leftIndex) * cellWidth - offset;
        const {endX} = this.state;

        let newWidth = (width + clientX - endX);
        if (newWidth < minWidth)
            newWidth = minWidth;
        else if (newWidth > maxWidth)
            newWidth = maxWidth;

        this.setState({width: newWidth});
    }

    stopEndDrag = (ev) => {
        ev.stopPropagation();

        if(supportTouch) {
            this.endResizer.removeEventListener('touchmove', this.doEndDrag, false);
            this.endResizer.removeEventListener('touchend', this.stopEndDrag, false);
            this.endResizer.removeEventListener('touchcancel', this.cancelEndDrag, false);
        } else {
            document.documentElement.removeEventListener('mousemove', this.doEndDrag, false);
            document.documentElement.removeEventListener('mouseup', this.stopEndDrag, false);
        }
        document.onselectstart = null;
        document.ondragstart = null;
        const {width, left, top, leftIndex, rightIndex, schedulerData, eventItem, updateEventEnd, conflictOccurred} = this.props;
        schedulerData._stopResizing();
        if(this.state.width === width) return;

        let clientX = 0;
        if(supportTouch) {
            if(ev.changedTouches.length == 0) {
                this.setState({
                    left: left,
                    top: top,
                    width: width,
                });
                return;
            }
            const touch = ev.changedTouches[0];
            clientX = touch.pageX;
        } else {
            clientX = ev.clientX;
        }
        const {headers, cellUnit, events, config, localeMoment} = schedulerData;
        let cellWidth = schedulerData.getContentCellWidth();
        let offset = leftIndex > 0 ? 5 : 6;
        let minWidth = cellWidth - offset;
        let maxWidth = (headers.length - leftIndex) * cellWidth - offset;
        const {endX} = this.state;

        let newWidth = (width + clientX - endX);
        let deltaX = newWidth - width;
        let sign = deltaX < 0 ? -1 : (deltaX === 0 ? 0 : 1);
        let count = (sign < 0 ? Math.floor(Math.abs(deltaX) / cellWidth) : Math.ceil(Math.abs(deltaX) / cellWidth)) * sign;
        if (newWidth < minWidth)
            count = leftIndex - rightIndex + 1;
        else if (newWidth > maxWidth)
            count = headers.length - rightIndex;
        let newEnd = localeMoment(eventItem.end).add(cellUnit === CellUnits.Hour ? count * config.minuteStep : count, cellUnit === CellUnits.Hour ? 'minutes' : 'days').format(DATETIME_FORMAT);
        if(count !== 0 && cellUnit !== CellUnits.Hour && config.displayWeekend === false) {
            if(count > 0) {
                let tempCount = 0, i = 0;
                while (true) {
                    i++;
                    let tempEnd = localeMoment(eventItem.end).add(i, 'days');
                    let dayOfWeek = tempEnd.weekday();
                    if(dayOfWeek !== 0 && dayOfWeek !== 6) {
                        tempCount ++;
                        if(tempCount === count) {
                            newEnd = tempEnd.format(DATETIME_FORMAT);
                            break;
                        }
                    }

                }
            } else {
                let tempCount = 0, i = 0;
                while (true) {
                    i--;
                    let tempEnd = localeMoment(eventItem.end).add(i, 'days');
                    let dayOfWeek = tempEnd.weekday();
                    if(dayOfWeek !== 0 && dayOfWeek !== 6) {
                        tempCount --;
                        if(tempCount === count) {
                            newEnd = tempEnd.format(DATETIME_FORMAT);
                            break;
                        }
                    }
                }
            }
        }

        let hasConflict = false;
        let slotId = schedulerData._getEventSlotId(eventItem);
        let slotName = undefined;
        let slot = schedulerData.getSlotById(slotId);
        if(!!slot)
            slotName = slot.name;
        if (config.checkConflict) {
            let start = localeMoment(eventItem.start),
                end = localeMoment(newEnd);

            events.forEach((e) => {
                if (schedulerData._getEventSlotId(e) === slotId && e.id !== eventItem.id) {
                    let eStart = localeMoment(e.start),
                        eEnd = localeMoment(e.end);
                    if ((start >= eStart && start < eEnd) || (end > eStart && end <= eEnd) || (eStart >= start && eStart < end) || (eEnd > start && eEnd <= end))
                        hasConflict = true;
                }
            });
        }

        if (hasConflict) {
            this.setState({
                left: left,
                top: top,
                width: width,
            });

            if (conflictOccurred != undefined) {
                conflictOccurred(schedulerData, 'EndResize', eventItem, DnDTypes.EVENT, slotId, slotName, eventItem.start, newEnd);
            }
            else {
                console.log('Conflict occurred, set conflictOccurred func in Scheduler to handle it');
            }
            this.subscribeResizeEvent(this.props);
        }
        else {
            if (updateEventEnd != undefined)
                updateEventEnd(schedulerData, eventItem, newEnd);
        }
    }

    cancelEndDrag = (ev) => {
        ev.stopPropagation();

        this.endResizer.removeEventListener('touchmove', this.doEndDrag, false);
        this.endResizer.removeEventListener('touchend', this.stopEndDrag, false);
        this.endResizer.removeEventListener('touchcancel', this.cancelEndDrag, false);
        document.onselectstart = null;
        document.ondragstart = null;
        const {schedulerData, left, top, width} = this.props;
        schedulerData._stopResizing();
        this.setState({
            left: left,
            top: top,
            width: width,
        });
    }

    render() {
        const {eventItem, isStart, isEnd, isInPopover, eventItemClick, schedulerData, isDragging, connectDragSource, connectDragPreview, eventItemTemplateResolver} = this.props;
        const {config, localeMoment} = schedulerData;
        const {left, width, top} = this.state;
        let roundCls = isStart ? (isEnd ? 'round-all' : 'round-head') : (isEnd ? 'round-tail' : 'round-none');
        let bgColor = config.defaultEventBgColor;
        if (!!eventItem.bgColor)
            bgColor = eventItem.bgColor;

        let titleText = schedulerData.behaviors.getEventTextFunc(schedulerData, eventItem);
        let content = (
            <EventItemPopover
                {...this.props}
                eventItem={eventItem}
                title={eventItem.title}
                startTime={eventItem.start}
                endTime={eventItem.end}
                statusColor={bgColor}/>
        );

        let start = localeMoment(eventItem.start);
        let eventTitle = isInPopover ? `${start.format('HH:mm')} ${titleText}` : titleText;
        let startResizeDiv = <div />;
        if (this.startResizable(this.props))
            startResizeDiv = <div className="event-resizer event-start-resizer" ref={(ref) => this.startResizer = ref}></div>;
        let endResizeDiv = <div />;
        if (this.endResizable(this.props))
            endResizeDiv = <div className="event-resizer event-end-resizer" ref={(ref) => this.endResizer = ref}></div>;

// Render the task bar/stripe 
        // let eventItemTemplate = (
        //     <div className={roundCls + ' event-item'} key={eventItem.id}
        //          style={{height: config.eventItemHeight, backgroundColor: bgColor}}>
        //         <span style={{marginLeft: '10px', lineHeight: `${config.eventItemHeight}px` }}>{eventTitle}</span>
        //     </div>
        // );

        const durationBeforeDeadline1 = eventItem.durationBeforeDeadline;
        const durationBeforeDeadline = durationBeforeDeadline1 + 1;
        const durationAfterDeadline = eventItem.durationAfterDeadline;
        const totalDuration = eventItem.totalDuration;
        const cellwidth = schedulerData.getContentCellWidth();
        const pieces = eventItem.pieces;
        const pcsPerDay = parseFloat((pieces / totalDuration).toFixed(1));

////////////////CONTEXT MENU/////////////////////
// const [contextMenuVisible, setContextMenuVisible] = useState(false);
// const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

// const contextMenuRef = useRef(null);

// useEffect(() => {
//   const handleClickOutside = (event) => {
//     if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
//       // Click occurred outside the context menu, so close it
//       closeContextMenu();
//     }
//   };

//   // Attach the event listener to the document
//   document.addEventListener('click', handleClickOutside);

//   // Clean up the event listener on component unmount
//   return () => {
//     document.removeEventListener('click', handleClickOutside);
//   };
// }, []);

// const handleContextMenu = (e) => {
//   e.preventDefault();

//   // Get the position of the right-click
//   const position = { top: e.pageY, left: e.pageX };

//   // Set the context menu position and make it visible
//   setContextMenuPosition(position);
//   setContextMenuVisible(true);
// };

// const closeContextMenu = () => {
//   // Close the context menu
//   setContextMenuVisible(false);
// };

// const handleMenuItemClick = (action) => {
//   // Handle the menu item click based on the action
//   console.log(`Clicked on menu item: ${action}`);

//   // Close the context menu
//   closeContextMenu();
// };


        ////RIGHT CLICK CONTEXT MENU////
        let contextMenu = null; // Declare contextMenu outside the function to track the currently open menu
        const handleContextMenu = (e) => {
            e.preventDefault();
        
            // Close the previous context menu if it exists
            if (contextMenu) {
                document.body.removeChild(contextMenu);
            }
        
            // Create a new context menu container
            contextMenu = document.createElement('div');
            contextMenu.style.position = 'absolute';
            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.backgroundColor = '#fff';
            contextMenu.style.border = '1px solid #ddd';
            contextMenu.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
            contextMenu.style.padding = '5px';
            contextMenu.style.zIndex = '1000';
            contextMenu.style.borderRadius = '9px';
        
            // Create clickable menu items
            const createMenuItem = (text, onClick, addBorder, pcsPerDayValue) => {
                const menuItem = document.createElement('div');
                menuItem.textContent = text;
                menuItem.style.cursor = 'pointer';
                menuItem.style.padding = '8px';
                menuItem.style.marginBottom = '4px';
                menuItem.style.borderRadius = '4px';
                menuItem.style.transition = 'background-color 0.3s';
        
                if (addBorder) {
                    menuItem.style.borderBottom = '1px solid #ddd';
                }
        
                menuItem.addEventListener('mouseover', () => {
                    menuItem.style.backgroundColor = '#f0f0f0';
                });
        
                menuItem.addEventListener('mouseout', () => {
                    menuItem.style.backgroundColor = 'transparent';
                });
        
                menuItem.addEventListener('click', () => {
                    // Handle the click for the menu item
                    onClick(pcsPerDayValue);
                    // Close the context menu
                    document.body.removeChild(contextMenu);
                    contextMenu = null;
                });
        
                return menuItem;
            };
        
            // Create menu items
            // const menuItem1 = createMenuItem('Edit', openEditPopup, true, pcsPerDay);
            const menuItem1 = createMenuItem('Edit', () => openEditPopup(pcsPerDay, menuItem1), true, pcsPerDay);
            const menuItem2 = createMenuItem('Option 2', () => console.log('Option 2 clicked!'), true);
            const menuItem3 = createMenuItem('Option 3', () => console.log('Option 3 clicked!'), true);
            const menuItem4 = createMenuItem('Option 4', () => console.log('Option 4 clicked!'), false);
        
            // Append menu items to the context menu
            contextMenu.appendChild(menuItem1);
            contextMenu.appendChild(menuItem2);
            contextMenu.appendChild(menuItem3);
            contextMenu.appendChild(menuItem4);
        
            // Append the context menu to the body
            document.body.appendChild(contextMenu);
        
            // Close the context menu when clicking outside of it
            const closeContextMenu = (event) => {
                if (contextMenu && !contextMenu.contains(event.target)) {
                    document.body.removeChild(contextMenu);
                    contextMenu = null;
                    document.removeEventListener('click', closeContextMenu);
                }
            };
        
            // Listen for clicks outside the context menu
            document.addEventListener('click', closeContextMenu);
        };
        

       //// Popup for edit the span ////
        const openEditPopup = (pcsPerDayValue, relatedSpan) => {
            // Create a popup container
            const popupContainer = document.createElement('div');
            popupContainer.style.position = 'fixed';
            popupContainer.style.top = '50%';
            popupContainer.style.left = '50%';
            popupContainer.style.transform = 'translate(-50%, -50%)';
            popupContainer.style.backgroundColor = '#fff';
            popupContainer.style.border = '1px solid #ddd';
            popupContainer.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
            popupContainer.style.padding = '20px';
            popupContainer.style.zIndex = '1001';
            popupContainer.style.borderRadius = '9px';
            popupContainer.style.opacity = '0'; // Initial opacity
            popupContainer.style.transition = 'opacity 0.3s ease-in'; // Fade-in animation

            // Text at center-top of the popup
            const topText = document.createElement('div');
            topText.textContent = 'Edit Pcs';
            topText.style.fontSize = '18px';
            topText.style.fontWeight = 'bold';
            topText.style.textAlign = 'center';
            topText.style.marginBottom = '10px';

            // Input field for editing pcsPerDayValue
            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.value = pcsPerDayValue;
            valueInput.style.marginBottom = '10px';
            valueInput.style.width = '100%';
            valueInput.style.padding = '8px';
            valueInput.style.border = '1px solid #ddd';
            valueInput.style.borderRadius = '4px';
            valueInput.style.transition = 'border-color 0.3s';

            // Event listener to allow only numeric input
            valueInput.addEventListener('input', () => {
                valueInput.value = valueInput.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
            });

            // Save button
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.style.marginRight = '10px';
            saveButton.addEventListener('click', () => {
                // Handle save logic here with the updated value
                const updatedValue = valueInput.value;
                console.log('Save clicked! Updated Value:', updatedValue);
                
                // Update pcsPerDay value
                pcsPerDayValue = updatedValue;
                // Display the updated value in the related span
                relatedSpan.textContent = `${updatedValue} pcs`;

                // Close the popup
                document.body.removeChild(popupContainer);
            });

            // Cancel button
            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                // Handle cancel logic here
                console.log('Cancel clicked!');
                // Close the popup
                document.body.removeChild(popupContainer);
            });

            // Append elements to the popup container
            popupContainer.appendChild(topText);
            popupContainer.appendChild(valueInput);
            popupContainer.appendChild(saveButton);
            popupContainer.appendChild(cancelButton);

            // Append the popup container to the body
            document.body.appendChild(popupContainer);

            // Triggering reflow to apply initial opacity and start the animation
            popupContainer.offsetHeight; // eslint-disable-line no-unused-expressions
            popupContainer.style.opacity = '1';
        };


        

        
        // let eventItemTemplate = (
        //     <div className={roundCls + ' event-item'} key={eventItem.id}
        //          style={{ height: config.eventItemHeight, backgroundColor: bgColor }}>
        //                <span style={{ marginLeft: '10px' }}>{eventTitle}</span>

        //         <div className="left-bar" id='1'
        //              style={{
        //                 //  width: `${(durationBeforeDeadline / totalDuration) * 100}%`,
        //                  width: `${durationBeforeDeadline * cellwidth}px`,
        //                  height: '100%',
        //                  backgroundColor: 'cornflowerblue',
        //                  float: 'left'
        //              }}>
        //         </div>
        //         <div className="right-bar" id='2'
        //              style={{
        //                  width: `${durationAfterDeadline * cellwidth}px`,
        //                  height: '100%',
        //                  backgroundColor: 'red',
        //                  float: 'left'
        //              }}>
        //         </div>
        //         {/* <span style={{ marginLeft: '10px', lineHeight: `${config.eventItemHeight}px` }}>{eventTitle}</span> */}
        //     </div>
        // );


////////////////////////////////////////////////////////


let eventItemTemplate = (
    // Event item container
    <div className={roundCls + ' event-item'} key={eventItem.id}
         style={{ height: config.eventItemHeight, backgroundColor: bgColor, position: 'relative' }}>
        {/* Left bar representing duration before deadline */}
        <div className="left-bar" id='1'
             style={{
                 width: `${durationBeforeDeadline * cellwidth}px`,
                 height: '100%',
                 backgroundColor: 'cornflowerblue',
                 float: 'left',
                 position: 'relative'
             }}>
           
             {/* Small div inside left-bar */}
             <div style={{ width: `${cellwidth}px`, height: `${config.eventItemHeight}px`, position: 'absolute', top: 0, left: 0 }}>
                {/* Display the value of pcsPerDay in center */}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}></span>
             </div>
        </div>

        {/* Right bar representing duration after deadline */}
        <div className="right-bar" id='2'
             style={{
                 width: `${durationAfterDeadline * cellwidth}px`,
                 height: '100%',
                 backgroundColor: 'red',
                 float: 'left',
                 position: 'relative'
             }}>
         
             {/* Small div inside right-bar */}
             <div style={{ width: `${cellwidth}px`, height: `${config.eventItemHeight}px`, position: 'absolute', top: 0, left: 0 }}>
                {/* Display the value of pcsPerDay in center */}
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}></span>
             </div>
        </div>

        {/* Container for vertical lines with context menu */}
        <div onContextMenu={(e) => handleContextMenu(e)} className="vertical-lines" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
            {/* Iterate for each cell and display vertical lines */}
            {[...Array(totalDuration)].map((_, index) => (
                <span key={index} style={{ width: `${cellwidth}px`, height: `${config.eventItemHeight}px`, display: 'inline-block', position: 'relative', zIndex: 1 }}>
                    {/* Display the value of pcsPerDay next to each vertical line */}
                    <span style={{ position: 'absolute', top: '0%', transform: 'translateY(-50%)', left: '50%', transform: 'translateX(-50%)', color: '#fff' }}>{pcsPerDay} pcs</span>
                    {/* Display the white vertical line at the right end of each cell */}
                    <span style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '1px', backgroundColor: '#fff' }}></span>
                </span>
            ))}
        </div>
   
    </div>
);


console.log("PIECES:"+pieces);
console.log("PIECES per Day:"+pcsPerDay);
////////////////////////////////////////////////////////


// Before
console.log ('After deadline:'+ durationAfterDeadline);
console.log ('Before deadline:'+ durationBeforeDeadline);
console.log ('Total duration:'+ totalDuration);

// After
console.log ('updated duration before deadline:'+durationBeforeDeadline);
console.log ('updated duration after deadline:'+durationAfterDeadline);
console.log ('updated Total duration:'+ totalDuration);
console.log ('Cell width:'+ cellwidth);

        if(eventItemTemplateResolver != undefined)
            eventItemTemplate = eventItemTemplateResolver(schedulerData, eventItem, bgColor, isStart, isEnd, 'event-item', config.eventItemHeight, undefined);

        let a = <a className="timeline-event" style={{left: left, width: width, top: top}} onClick={() => { if(!!eventItemClick) eventItemClick(schedulerData, eventItem);}}>
            {eventItemTemplate}
            {startResizeDiv}
            {endResizeDiv}
        </a>;

        return (
            isDragging ? null : ( schedulerData._isResizing() || config.eventItemPopoverEnabled == false || eventItem.showPopover == false ?
                    <div>
                        {
                            connectDragPreview(
                                connectDragSource(a)
                            )
                        }
                    </div> :
                    <Popover placement="bottomLeft" content={content} trigger="hover">
                        {
                            connectDragPreview(
                                connectDragSource(a)
                            )
                        }
                    </Popover>
            )
        );
    }

    startResizable = (props) => {
        const {eventItem, isInPopover, schedulerData} = props;
        const {config} = schedulerData;
        return config.startResizable === true && isInPopover === false
            && (eventItem.resizable == undefined || eventItem.resizable !== false)
            && (eventItem.startResizable == undefined || eventItem.startResizable !== false);
    }

    endResizable = (props) => {
        const {eventItem, isInPopover, schedulerData} = props;
        const {config} = schedulerData;
        return config.endResizable === true && isInPopover === false
            && (eventItem.resizable == undefined || eventItem.resizable !== false)
            && (eventItem.endResizable == undefined || eventItem.endResizable !== false);
    }

    subscribeResizeEvent = (props) => {
        if (this.startResizer != undefined) {
            if(supportTouch) {
                // this.startResizer.removeEventListener('touchstart', this.initStartDrag, false);
                // if (this.startResizable(props))
                //     this.startResizer.addEventListener('touchstart', this.initStartDrag, false);
            } else {
                this.startResizer.removeEventListener('mousedown', this.initStartDrag, false);
                if (this.startResizable(props))
                    this.startResizer.addEventListener('mousedown', this.initStartDrag, false);
            }
        }
        if (this.endResizer != undefined) {
            if(supportTouch) {
                // this.endResizer.removeEventListener('touchstart', this.initEndDrag, false);
                // if (this.endResizable(props))
                //     this.endResizer.addEventListener('touchstart', this.initEndDrag, false);
            } else {
                this.endResizer.removeEventListener('mousedown', this.initEndDrag, false);
                if (this.endResizable(props))
                    this.endResizer.addEventListener('mousedown', this.initEndDrag, false);
            }
        }
    }
}

export default EventItem