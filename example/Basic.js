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
                    {/* <h3 style={{textAlign: 'center'}}>Basic example<ViewSrcCode srcCodeUrl="https://github.com/StephenChou1017/react-big-scheduler/blob/master/example/Basic.js" /></h3> */}
                    
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

        const clipboardData = JSON.parse(clipboardText);
        return clipboardData;
    } catch (error) {
        console.error('Error accessing or clearing clipboard data:', error);
        return null;
    }
};


//Display the tasks in blue or red if there delayed time period available
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

            // Assuming you have a deadline date stored in your schedulerData
            const deadline = moment(clipboardData.deadline); // actual deadline date

            let smv = clipboardData.smv, pcs = clipboardData.pieces, tmemb = 0;

            schedulerData.resources.forEach(findtmemb => {
                if (findtmemb.id == slotId) {
                    tmemb = findtmemb.teamMembers;
                }
            });

            const totalDuration = ((pcs * smv) / (tmemb * 480));
            const roundedTotalDuration = Math.ceil(totalDuration);

            // Convert the 'start' date to a moment object
            const startMoment = moment(start);

            // Calculate the duration before the deadline
            const timeBeforeDeadline = moment(deadline).diff(startMoment, 'days');
            const durationBeforeDeadline = Math.min(timeBeforeDeadline, roundedTotalDuration);
console.log("Before delay time: "+durationBeforeDeadline+" days") //consoling the time

            // Calculate the duration after the deadline
            const durationAfterDeadline = Math.max(0, roundedTotalDuration - (timeBeforeDeadline+1));
console.log("Delay time: "+durationAfterDeadline+" days") //consoling the delay time
            // Add the 'durationBeforeDeadline' in days to the 'start' date
            const endBeforeDeadline = startMoment.clone().add(durationBeforeDeadline, 'days');

            // Add the 'durationAfterDeadline' in days to the 'start' date
            const endAfterDeadline = startMoment.clone().add(roundedTotalDuration, 'days');

            // Create a new event object with appropriate styling based on deadline
            const newEvent = {
                id: newFreshId,
                title: clipboardData.oID || 'New event you just created',
                start: start,
                end: endAfterDeadline.format(), // Using the total duration for the end date
                resourceId: slotId,
                durationAfterDeadline: durationAfterDeadline,
                durationBeforeDeadline: durationBeforeDeadline,
                totalDuration: roundedTotalDuration,
                pcs: pcs,
                smv: smv,
                // Set the bgColor based on whether the entire task can be completed before the deadline
                bgColor: durationAfterDeadline === 0 ? 'cornflowerblue' : 'red',
                rrule: 'FREQ=DAILY;COUNT=1',
                resizable: false,
                movable: true,
                endResizable: false,
                // Set the duration using the provided duration or calculate it from start and end dates
                duration: duration !== undefined ? duration : roundedTotalDuration,
                // Include other properties as they were
                // For example: type, item, etc.
                ...clipboardData,
            };

            // Set the bar length based on the total duration
            newEvent.barInnerAddon = {
                width: `${roundedTotalDuration * 100}%`,
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

//TWO STRIPES EDITION DELAYED PART IS SHOWN IN UNDER THE BLUE TASK IN RED CLR
// newEvent = async (schedulerData, slotId, slotName, start, end, type, item, duration) => {
//     try {
//         // Fetch data from the clipboard
//         const clipboardData = await this.getClipboardData();

//         if (clipboardData) {
//             // Print the pasting data in the console
//             console.log('Pasting Data:', clipboardData);

//             // Find a fresh ID for the new event
//             let newFreshId = 0;
//             schedulerData.events.forEach(existingEvent => {
//                 if (existingEvent.id >= newFreshId) {
//                     newFreshId = existingEvent.id + 1;
//                 }
//             });

//             // Assuming you have a deadline date stored in your schedulerData
//             const deadline = moment(clipboardData.deadline); // actual deadline date

//             let smv = clipboardData.smv, pcs = clipboardData.pieces, tmemb = 0;

//             schedulerData.resources.forEach(findtmemb => {
//                 if (findtmemb.id == slotId) {
//                     tmemb = findtmemb.teamMembers;
//                 }
//             });

//             const totalDuration = ((pcs * smv) / (tmemb * 480));
//             const roundedTotalDuration = Math.ceil(totalDuration);

//             // Convert the 'start' date to a moment object
//             const startMoment = moment(start);

//             // Calculate the duration before the deadline
//             const timeBeforeDeadline = moment(deadline).diff(startMoment, 'days');
//             const durationBeforeDeadline = Math.min(timeBeforeDeadline, roundedTotalDuration);

//             // Calculate the duration after the deadline
//             const durationAfterDeadline = Math.max(0, roundedTotalDuration - timeBeforeDeadline);
//             console.log(durationAfterDeadline) // consoling the delay time

//             // Add the 'durationBeforeDeadline' in days to the 'start' date
//             const endBeforeDeadline = startMoment.clone().add(durationBeforeDeadline, 'days');

//             // Add the 'durationAfterDeadline' in days to the 'start' date
//             const endAfterDeadline = startMoment.clone().add(roundedTotalDuration, 'days');

//             // Create a new event object with appropriate styling based on deadline
//             const newEvent = {
//                 id: newFreshId,
//                 title: clipboardData.oID || 'New event you just created',
//                 start: start,
//                 end: endAfterDeadline.format(), // Using the total duration for the end date
//                 resourceId: slotId,
//                 pcs: pcs,
//                 smv: smv,
//                 // Set the bgColor based on whether the entire task can be completed before the deadline
//                 bgColor: 'cornflowerblue',
//                 rrule: 'FREQ=DAILY;COUNT=1',
//                 resizable: false,
//                 movable: true,
//                 endResizable: false,
//                 // Set the duration using the provided duration or calculate it from start and end dates
//                 duration: duration !== undefined ? duration : roundedTotalDuration,
//                 // Include other properties as they were
//                 // For example: type, item, etc.
//                 ...clipboardData,
//             };

//             // Set the bar length based on the total duration
//             newEvent.barInnerAddon = {
//                 width: `${roundedTotalDuration * 100}%`,
//             };

//             // If there's a part after the deadline, add it as a separate event with 'red' bgColor
//             if (durationAfterDeadline > 0) {
//                 const afterDeadlineEvent = {
//                     id: newFreshId + 1,
//                     title: clipboardData.oID || 'New event you just created',
//                     start: endBeforeDeadline.format(), // Starting where the first event ends
//                     end: endAfterDeadline.format(), // Using the total duration for the end date
//                     resourceId: slotId,
//                     pcs: pcs,
//                     smv: smv,
//                     bgColor: 'red',
//                     rrule: 'FREQ=DAILY;COUNT=1',
//                     resizable: false,
//                     movable: true,
//                     endResizable: false,
//                     duration: durationAfterDeadline,
//                     ...clipboardData,
//                 };

//                 // Set the bar length based on the total duration
//                 afterDeadlineEvent.barInnerAddon = {
//                     width: `${durationAfterDeadline * 100}%`,
//                 };

//                 // Add the second part after the deadline to the scheduler data
//                 schedulerData.addEvent(afterDeadlineEvent);
//             }

//             // Add the new event to the scheduler data
//             schedulerData.addEvent(newEvent);

//             // Update the component state with the new scheduler data
//             this.setState({
//                 viewModel: schedulerData,
//             });
//         }
//     } catch (error) {
//         console.error('Error creating new event:', error);
//         alert('Error creating new event. Please check console for details.');
//     }
// };



// newEvent = async (schedulerData, slotId, slotName, start, end, type, item, duration) => {
//     try {
//         // Fetch data from the clipboard
//         const clipboardData = await this.getClipboardData();

//         if (clipboardData) {
//             // Print the pasting data in the console
//             console.log('Pasting Data:', clipboardData);

//             // Find a fresh ID for the new event
//             let newFreshId = 0;
//             schedulerData.events.forEach(existingEvent => {
//                 if (existingEvent.id >= newFreshId) {
//                     newFreshId = existingEvent.id + 1;
//                 }
//             });

         

//             let smv = clipboardData.smv, pcs = clipboardData.pieces, tmemb = 0;
//             // const tmemb = findResourcetmemb(schedulerData, slotId);
//             schedulerData.resources.forEach(findtmemb => {
//                 if (findtmemb.id == slotId) {
//                     tmemb = findtmemb.teamMembers;
//                 }
//             });

//            //find the tmemb of the resource, id == slotId 
//             console.log("Slot: ",slotId);
//             console.log("smv: ", smv);
//             console.log("Pcs: ",pcs);
//             console.log("tmemb: ",tmemb);

//             // Calculate the duration in days
//             const Duration = ((pcs*smv)/(tmemb*480));
//             const roundedDate = Math.ceil(Duration);
            
           

//             // Convert the 'start' date to a moment object
//             const startMoment = moment(start);
//             console.log("start moment: ")
//             // console.log(durationInDays)

//             // Add the 'roundedDate' in days to the 'start' date
//             console.log("end: ", startMoment.add(roundedDate, 'days'));

//             // Format the result back to a string
//             const end = startMoment.format();

//             console.log("rounded: ", roundedDate);
//             console.log("start: ", start);
//             console.log("end: ", end);

//             // Create a new event object
//             const newEvent = {
//                 id: newFreshId,
//                 title: clipboardData.oID || 'New event you just created',
//                 start: start,
//                 end: end,
//                 resourceId: slotId,
//                 pcs: pcs,
//                 smv: smv,
//                 bgColor: 'cornflowerblue ',
//                 rrule: 'FREQ=DAILY;COUNT=1',
//                 resizable: false,
//                 movable: true,
//                 endResizable: false,
//                 // Set the duration using the provided duration or calculate it from start and end dates
//                 duration: duration !== undefined ? duration : roundedDate,
//                 // Include other properties as they were
//                 // For example: type, item, etc.
//                 ...clipboardData,
//             };

//             // Set the bar length based on the duration
//             newEvent.barInnerAddon = {
//                 // Assuming your scheduling library expects a format like 'height: 50%'
//                 width: `${(duration !== undefined ? duration : roundedDate) * 100}%`,
//             };

//             // Add the new event to the scheduler data
//             schedulerData.addEvent(newEvent);

//             // Update the component state with the new scheduler data
//             this.setState({
//                 viewModel: schedulerData,
//             });
//         }
//     } catch (error) {
//         console.error('Error creating new event:', error);
//         alert('Error creating new event. Please check console for details.');
//     }
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

//Update the task color when it moves according to the delay time period
    moveEvent = (schedulerData, event, slotId, slotName, start, end) => {
        try {
            console.log("Update");
    
            let smv = event.smv, pcs = event.pcs, tmemb = 0;
    
            schedulerData.resources.forEach(findtmemb => {
                if (findtmemb.id == slotId) {
                    tmemb = findtmemb.teamMembers;
                }
            });
    
            const Duration = ((pcs * smv) / (tmemb * 480));
            const roundedDate = Math.ceil(Duration);
    
            const startMoment = moment(start);
    
            // Calculate the new end date after the move
            const newEndMoment = startMoment.clone().add(roundedDate, 'days');
            const newEnd = newEndMoment.format();
    
            // Assuming you have a deadline date stored in your schedulerData
            const deadline = moment(event.deadline); // Replace this with your actual deadline date
    
            // Calculate the duration before the deadline
            const timeBeforeDeadline = moment(deadline).diff(startMoment, 'days');
            const durationBeforeDeadline = Math.min(timeBeforeDeadline, roundedDate);
console.log("Updated before delay time: "+durationBeforeDeadline+" days") //consoling the time
    
            // Calculate the duration after the deadline
            const durationAfterDeadline = Math.max(0, roundedDate - (timeBeforeDeadline+1));
console.log("Updated delay time: "+durationAfterDeadline+" days") //consoling the updated delay time 
            // Update the color of the event based on whether it exceeds the deadline
            event.bgColor = durationAfterDeadline === 0 ? 'cornflowerblue' : 'red';
    
            event.durationBeforeDeadline = durationBeforeDeadline;
            event.durationAfterDeadline = durationAfterDeadline;
            event.totalDuration = roundedDate;

            // Move the event with the updated color
            schedulerData.moveEvent(event, slotId, slotName, start, newEnd);
    
            // Update the component state with the new scheduler data
            this.setState({
                viewModel: schedulerData,
            });
        } catch (error) {
            console.error('Error moving event:', error);
            alert('Error moving event. Please check console for details.');
        }
    };
    
    

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
