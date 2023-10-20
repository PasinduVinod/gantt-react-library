import React, {Component} from 'react'
import {PropTypes} from 'prop-types' 
//import moment from 'moment'
//import 'moment/locale/zh-cn';
// import 'antd/lib/style/index.less';     //Add this code for locally example
import Scheduler, {SchedulerData, ViewTypes, DATE_FORMAT, DemoData} from '../src/index'
// import Nav from './Nav'
import Tips from './Tips'
import ViewSrcCode from './ViewSrcCode'
import withDragDropContext from './withDnDContext'
import PopupOrders from './Popuporders'
import moment from 'moment';
import CollapsePanel from 'antd/lib/collapse/CollapsePanel'


class Basic extends Component {
    constructor(props) {
      super(props);
    
      
      let currentDate = new Date(); // Get current date
      let formattedCurrentDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
      let schedulerData = new SchedulerData(formattedCurrentDate, ViewTypes.Week, false, false, {
        displayWeekend: false,
        checkConflict: false,
        resizable: false,
      });

      schedulerData.localeMoment.locale('en');
      schedulerData.setResources(DemoData.resources);
      schedulerData.setEvents(DemoData.events);
      this.state = {
        viewModel: schedulerData
      };
    }
  

    render(){
        const {viewModel} = this.state;
        return (
            <div>
                {/* <Nav /> */}
                <div>
                    <div>
                        <PopupOrders/>
                    </div>
                    <h3 style={{textAlign: 'center'}}>Basic example<ViewSrcCode srcCodeUrl="https://github.com/StephenChou1017/react-big-scheduler/blob/master/example/Basic.js" /></h3>
                    
                    <Scheduler schedulerData={viewModel}
                               prevClick={this.prevClick}
                               nextClick={this.nextClick}
                               onSelectDate={this.onSelectDate}
                               onViewChange={this.onViewChange}
                               eventItemClick={this.eventClicked}
                               viewEventClick={this.ops1}
                               viewEventText="Ops 1"
                               viewEvent2Text="Ops 2"
                               viewEvent2Click={this.ops2}
                               updateEventStart={this.updateEventStart}
                               updateEventEnd={this.updateEventEnd}
                               moveEvent={this.moveEvent}
                               newEvent={this.newEvent}
                               onScrollLeft={this.onScrollLeft}
                               onScrollRight={this.onScrollRight}
                               onScrollTop={this.onScrollTop}
                               onScrollBottom={this.onScrollBottom}
                               conflictOccurred={this.conflictOccurred} //overlap
                               toggleExpandFunc={this.toggleExpandFunc}
                    />
                </div>
                {/* <Tips /> */}
            </div>
        )
    }

    prevClick = (schedulerData)=> {
        schedulerData.prev();
        schedulerData.setEvents(DemoData.events);
        this.setState({
            viewModel: schedulerData
        })
    }

    nextClick = (schedulerData)=> {
        schedulerData.next();
        schedulerData.setEvents(DemoData.events);
        this.setState({
            viewModel: schedulerData
        })
    }

    onViewChange = (schedulerData, view) => {
        schedulerData.setViewType(view.viewType, view.showAgenda, view.isEventPerspective);
        schedulerData.setEvents(DemoData.events);
        this.setState({
            viewModel: schedulerData
        })
    }

    onSelectDate = (schedulerData, date) => {
        schedulerData.setDate(date);
        schedulerData.setEvents(DemoData.events);
        this.setState({
            viewModel: schedulerData
        })
    }

    eventClicked = (schedulerData, event) => {
        // alert(`You just clicked an event: {id: ${event.id}, title: ${event.title}}`);
    };

    ops1 = (schedulerData, event) => {
        alert(`You just executed ops1 to event: {id: ${event.id}, title: ${event.title}}`);
    };

    ops2 = (schedulerData, event) => {
        alert(`You just executed ops2 to event: {id: ${event.id}, title: ${event.title}}`);
    };
 
////Paste the copied data to the gantt chart 
getClipboardData = async () => {
    try {
        // Use the Clipboard API to access data from the clipboard
        const clipboardText = await navigator.clipboard.readText();

        // Clear the clipboard after reading the data
        await navigator.clipboard.writeText('');

        // Parse the clipboard text or perform any necessary transformations
        // In this example, I assume the clipboard contains a JSON string
        const clipboardData = JSON.parse(clipboardText);
        return clipboardData;
    } catch (error) {
        console.error('Error accessing or clearing clipboard data:', error);
        return null;
    }
};

newEvent = async (schedulerData, slotId, slotName, start, end, type, item, duration) => {
    try {
        // Fetch data from the clipboard
        const clipboardData = await this.getClipboardData();

        if (clipboardData) {
            // Print the pasting data in the console
            console.log('Pasting Data:', clipboardData);

            // Find a fresh ID for the new event
            let newFreshId = 0;
            schedulerData.events.forEach(existingEvent => {
                if (existingEvent.id >= newFreshId) {
                    newFreshId = existingEvent.id + 1;
                }
            });

            // Calculate the duration between start and end dates using moment duration
            // const momentDuration = moment.duration(moment(end).diff(moment(start)));

            let smv = clipboardData.smv, pcs = clipboardData.pieces, gsmv = 0;
            // const gsmv = findResourceGSMV(schedulerData, slotId);
            schedulerData.resources.forEach(findgsmv => {
                if (findgsmv.id == slotId) {
                    gsmv = findgsmv.noOfresources;
                }
            });

           //find the gsmv of the resource, id == slotId 
            console.log("Slot: ",slotId);
            console.log("smv: ", smv);
            console.log("Pcs: ",pcs);
            console.log("GSMV: ",gsmv);

            // Calculate the duration in days
            const Duration = ((pcs*smv)/(gsmv*480));
            const roundedDate = Math.ceil(Duration);
            
            // const durationInDays = roundedDate.asDays();
            // console.log("duration: ",durationInDays);
            // console.log("Start : ",moment(start));
            // const end = start + roundedDate;

            // Convert the 'start' date to a moment object
            const startMoment = moment(start);
            console.log("start moment: ")
            // console.log(durationInDays)

            // Add the 'roundedDate' in days to the 'start' date
            console.log("end: ", startMoment.add(roundedDate, 'days'));

            // Format the result back to a string
            const end = startMoment.format();

            console.log("rounded: ", roundedDate);
            console.log("start: ", start);
            console.log("end: ", end);

            // Create a new event object
            const newEvent = {
                id: newFreshId,
                title: clipboardData.oID || 'New event you just created',
                start: start,
                end: end,
                resourceId: slotId,
                pcs: pcs,
                smv: smv,
                bgColor: 'purple',
                rrule: 'FREQ=DAILY;COUNT=1',
                resizable: false,
                movable: true,
                endResizable: false,
                // Set the duration using the provided duration or calculate it from start and end dates
                duration: duration !== undefined ? duration : roundedDate,
                // Include other properties as they were
                // For example: type, item, etc.
                ...clipboardData,
            };

            // Set the bar length based on the duration
            newEvent.barInnerAddon = {
                // Assuming your scheduling library expects a format like 'height: 50%'
                width: `${(duration !== undefined ? duration : roundedDate) * 100}%`,
            };

            // Add the new event to the scheduler data
            schedulerData.addEvent(newEvent);

            // Update the component state with the new scheduler data
            this.setState({
                viewModel: schedulerData,
            });
        }
    } catch (error) {
        console.error('Error creating new event:', error);
        alert('Error creating new event. Please check console for details.');
    }
};





    // newEvent = (schedulerData, slotId, slotName, start, end, type, item) => {
    //     // if(confirm(`Do you want to create a new event? {slotId: ${slotId}, slotName: ${slotName}, start: ${start}, end: ${end}, type: ${type}, item: ${item}}`)){

    //         let newFreshId = 0;
    //         schedulerData.events.forEach((item) => {
    //             if(item.id >= newFreshId)
    //                 newFreshId = item.id + 1;
    //         });

    //         let newEvent = {
    //             id: newFreshId,
    //             title: 'New event you just created',
    //             start: start,
    //             end: end,
    //             resourceId: slotId,
    //             bgColor: 'purple'
    //         }
    //         schedulerData.addEvent(newEvent);
    //         this.setState({
    //             viewModel: schedulerData
    //         })
    //     // }
    // }

    // findResourceGSMV = (schedulerData, slotId) => {
    //     // Iterate through the resources to find the one with a matching id
    //     const matchingResource = schedulerData.resources;
    //     console.log("matching resource : ", matchingResource)
    //     if (matchingResource) {
    //         // Assuming "gsmv" is a property of the resource
    //         return matchingResource.gsmv || 0; // Replace 0 with a default value if necessary
    //     }
    //     return 0; // Return a default value if no matching resource is found
    // };
    
 

    updateEventStart = (schedulerData, event, newStart) => {
        if(confirm(`Do you want to adjust the start of the event? {eventId: ${event.id}, eventTitle: ${event.title}, newStart: ${newStart}}`)) {
            schedulerData.updateEventStart(event, newStart);
        }
        this.setState({
            viewModel: schedulerData
        })
    }

    updateEventEnd = (schedulerData, event, newEnd) => {
        schedulerData.updateEventEnd(event, newEnd);
        this.setState({
            viewModel: schedulerData
        })
    }

    moveEvent = (schedulerData, event, slotId, slotName, start, end) => {
        // if(confirm(`Do you want to move the event? {eventId: ${event.id}, eventTitle: ${event.title}, newSlotId: ${slotId}, newSlotName: ${slotName}, newStart: ${start}, newEnd: ${end}`)) {
        console.log("Update")
        
        let smv = event.smv, pcs = event.pcs, gsmv = 0;
        
        schedulerData.resources.forEach(findgsmv => {
            if (findgsmv.id == slotId) {
                gsmv = findgsmv.noOfresources;
            }
        });
        const Duration = ((pcs*smv)/(gsmv*480));
        const roundedDate = Math.ceil(Duration);

        const startMoment = moment(start);
        console.log("start moment: ")

        console.log("end: ", startMoment.add(roundedDate, 'days'));

        //     // Format the result back to a string
        let newend = startMoment.format();
        // end = newend;
        console.log("rounded: ", roundedDate);
        console.log("start: ", start);
        console.log("end: ", newend);
        
        schedulerData.moveEvent(event, slotId, slotName, start, newend);
            this.setState({
                viewModel: schedulerData
            })
        
    }

    onScrollRight = (schedulerData, schedulerContent, maxScrollLeft) => {
        if(schedulerData.ViewTypes === ViewTypes.Day) {
            schedulerData.next();
            schedulerData.setEvents(DemoData.events);
            this.setState({
                viewModel: schedulerData
            });
    
            schedulerContent.scrollLeft = maxScrollLeft - 10;
        }
    }

    onScrollLeft = (schedulerData, schedulerContent, maxScrollLeft) => {
        if(schedulerData.ViewTypes === ViewTypes.Day) {
            schedulerData.prev();
            schedulerData.setEvents(DemoData.events);
            this.setState({
                viewModel: schedulerData
            });

            schedulerContent.scrollLeft = 10;
        }
    }

    onScrollTop = (schedulerData, schedulerContent, maxScrollTop) => {
        console.log('onScrollTop');
    }

    onScrollBottom = (schedulerData, schedulerContent, maxScrollTop) => {
        console.log('onScrollBottom');
    }
 //overlap
    conflictOccurred = (schedulerData, action, event, type, slotId, slotName, start, end) => {

    }

    toggleExpandFunc = (schedulerData, slotId) => {
        schedulerData.toggleExpandStatus(slotId);
        this.setState({
            viewModel: schedulerData
        });
    }
}

export default withDragDropContext(Basic)
