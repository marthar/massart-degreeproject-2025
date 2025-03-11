import './App.css';

import React, { useReducer, useRef, useEffect, useLayoutEffect, useCallback, forwardRef } from "react"
import PropTypes from 'prop-types';

import Papa from "papaparse"

import { map, keys, find, filter, sortBy, groupBy, uniqBy } from "lodash"

import {
  HashRouter as Router,
  Switch,
  Route,
  Link,
  useParams
} from "react-router-dom";

import {
  parse
} from "date-fns"


const initialState = {
  detail: null,
  entries: [],
  search: "",
  view: "posters"
}

const symposiumDate = "Symposium April 29th 2025"

const viewReducer = (state, action) => {
  switch(action.type) { 
    case "ENTRIES":
      return { ...state, entries: action.entries }
    case "SEARCH":
      return { ...state, search: action.value }
    case "VIEW":
      return { ...state, view: action.value }
    default:
      return state;

  }
}

function processEntries(data) {
   let entries = map(data, (entry,idx) => { 

     let thumb = entry["Poster Thumbnail"];
     let poster = entry["Poster Full Size"];

     thumb = thumb.split("=")[1]
     poster = poster.split("=")[1]

     thumb = "https://lh3.googleusercontent.com/d/" + thumb;
     poster = "https://lh3.googleusercontent.com/d/" + poster;

     let slugs = (entry["YouTube Link"]||"").split("/")
     let youtube = slugs[slugs.length-1]
     
     if(youtube == "") { youtube = null; }
     
     const name = `${entry['First Name']} ${entry['Last Name']}`;

     let startTime = (entry["Time"]||"").split("–")[0];
     startTime = parse(startTime,'h:mma', new Date())

     return {
       key: idx,
       id: entry['Last Name'].toLowerCase(),
       thumb: thumb,
       poster: poster,
       first_name: entry['First Name'],
       last_name: entry['Last Name'],
       name: name,
       search: name.toLowerCase(),
       abstract: entry["Abstract"],
       time: entry["Time"],
       room: entry["Room Link"],
       room_name: entry['Room Name'],
       youtube: youtube,
       title: entry["Title"],
       start_time: startTime
     }
   })
   return sortBy(entries, (entry) => `${entry.last_name.toLowerCase()}-${entry.first_name.toLowerCase()}`);
}

function GalleryDetail({entries}) {
  let { id } = useParams();
  let entry= find(entries, (entry) => entry.id == id.toLowerCase())



  useEffect(() => {
    window.scrollTo(0,0)
  },[])

  if(!entry) {
    return <React.Fragment/>
  }

  return <React.Fragment>
         <header>
        <Link to="/"> <h3 className="back"><div>&laquo;</div> {symposiumDate}</h3></Link>
        <h1>{entry.title}</h1>
        <h2>{entry.name}</h2>
        </header>
      
        <section className="work">
            <div className='work-image'><img src={entry.poster} /></div>
             {entry.room != "" && <div className="time-block">
              <h2>{entry.time}<span className='room'>{entry.room_name}</span> </h2>
              <a target="_blank"  href={entry.room}><h2 className="button">Join Event</h2></a>
            </div>}
            {entry.abstract.split('\n\n').map((item, key) => {
              return <p key={key}>{item}</p>
            })}
            {entry.youtube && <div className="video">
              <iframe src={`https://www.youtube.com/embed/${entry.youtube}`} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>}  
             {entry.room != "" && <div className="time-block">
              <h2>{entry.time}<span className='room'>{entry.room_name}</span> </h2>
 <a target="_blank"  href={entry.room}><h2 className="button">Join Event</h2></a>
            </div>}
        </section>
        </React.Fragment>;
}

function GalleryItem({entry}) {
  return  <Link key={entry.key} to={`/${entry.id}`}>
              <div className="piece" >
                <div className='piece-image'><img src={entry.thumb} /></div>  
                <h1>{entry.title}</h1>
                <h2>{entry.name}</h2>
              </div>
           </Link>;
}


function TimeView({entries}) {
   const groupedEntries = groupBy(entries, (entry) => entry.start_time.toString())

   let times = map(entries, (entry) => [ entry.start_time, entry.time ] );
   times = uniqBy(times, (time) => time[0].toString())
   times = sortBy(times, (time) => time[0])

   return <div className="times">
     { map(times, (time) => {
       return <div key={time[0]} className="time">
         <div className="time--time">{time[1]}</div>
         <div className="time--names">
           {map(groupedEntries[time[0].toString()], (entry) => <div key={entry.key} className="time--name"><Link to={`/${entry.id}`}>{entry.name}</Link></div>)}
         </div>
       </div>; 
     }) }
   </div>
}


function runSearch(entries, search) {
  let q = search.toLowerCase()
  return filter(entries, (entry) => {
    return entry.search.includes(q)
  })
}


function App() {
  const [
    {
      detail,
      entries,
      search,
      view
    },
    dispatch
  ] = useReducer(viewReducer, initialState)


  useEffect(() => { 
       Papa.parse('https://docs.google.com/spreadsheets/d/1FYvkDPam_lAsu6aWvGAWxi_I7GOiMDQ4TwKwJO6sz6M/gviz/tq?tqx=out:csv', {
          download: true,
          header: true,
          complete: function(results) {
            dispatch({ type: "ENTRIES", entries: processEntries(results.data)})
          }
     })
   }, []);


  return (
    <Router>
    <div>
    <Switch>
          <Route exact path="/">
            <header>
              <h3>{symposiumDate}</h3>
              <h1>Degree Project <br/>Symposium</h1>
              <h2>MassArt Communication Design</h2>  
              <section id='search'>
                <input type='name' className="search" value={search} placeholder="search" onChange={(e)=>dispatch({type:"SEARCH", value:e.currentTarget.value}) }/>
                <img className='search-icon' src='./search.svg' width='15' height='15' />
              </section>
              <div className="view">
                <button className={`view-button ${view == 'posters' && "view-button--active"}`} onClick={() => dispatch({type:"VIEW",value:"posters"}) }>Posters</button>
                <button className={`view-button ${view == 'times' && "view-button--active"}`} onClick={() => dispatch({type:"VIEW",value:"times"}) }>Times</button>
              </div>
            </header>
            
            { view == 'posters' && <section id="gallery">
              {map(runSearch(entries,search), (entry,index) => <GalleryItem entry={entry} key={index} />) }
            </section> }
            { view == 'times' && <section id='time'>
              <TimeView entries={runSearch(entries,search)} />
              </section>}
          </Route>
          <Route path="/:id" children={<GalleryDetail entries={entries} />} />
        </Switch>
      <footer>
        <h3><img src="./light-logo.png" />621 Huntington Avenue, Boston, MA, 02115 | 617.879.7000 | &copy; 2025 | <a href="mailto:merettig@massart.edu?Subject=Degree%20Symposium" target="_top"> Contact Us</a></h3>
      </footer>
     </div>
    </Router>
  );
}

export default App;
