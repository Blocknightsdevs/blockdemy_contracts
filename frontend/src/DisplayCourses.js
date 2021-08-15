import React, { useRef, useEffect, useState } from "react";
import { Player } from "video-react";
import { Button, Input } from "react-bootstrap";
import ModalSale from "./ModalSale";
import Web3 from "web3";

function DisplayCourses({ courses, accounts, contract, bdemyContract }) {
  const [courseOnSale, setCourseOnSale] = useState({});

  useEffect(() => {
    console.log(courseOnSale);
  }, [courseOnSale]);

  const isEmpty = (obj) => {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        return false;
      }
    }

    return JSON.stringify(obj) === JSON.stringify({});
  };

  const notMoreOnSale = async (course) => {
    await contract.methods.notMoreOnSale(course.id).send({ from: accounts[0] });
    //should update state
    window.location.reload();
  };

  const buyCourse = async (course) => {
    await bdemyContract.methods
      .buyCourse(course.id)
      .send({ from: accounts[0], value: course.price });
    //should update state
    window.location.reload();
  };

  const getAllVideos = async (course) => {
    let videos = await contract.methods.getVideosOfCourse(course.id).call({ from: accounts[0] });
    console.log(videos);
  }

  return courses.map((course) => (
    <div key={course.id} className="shadow courseItem">
      {!isEmpty(courseOnSale) ? (
        <ModalSale
          accounts={accounts}
          contract={contract}
          courseOnSale={courseOnSale}
          setCourseOnSale={setCourseOnSale}
          isEmpty={isEmpty}
        />
      ) : (
        <></>
      )}

      <div>Course name: {course.title}</div>
      <br></br>
      <div>Owner: {course.owner}</div>
      <br></br>
      <div>Price: {Web3.utils.fromWei(course.price)} ETH</div>
      <br></br>
      {accounts && accounts[0] != course.owner && course.onSale ? (
        <Button onClick={() => buyCourse(course)}>Buy Course</Button>
      ) : accounts && accounts[0] == course.owner && !course.onSale ? (
        <Button onClick={() => setCourseOnSale(course)}>Put On Sale</Button>
      ) : accounts && accounts[0] == course.owner && course.onSale ? (
        <Button onClick={() => notMoreOnSale(course)}>Not More On Sale</Button>
      ) : (
        <></>
      )}

      <Player src={"https://ipfs.infura.io/ipfs/" + course.videos_preview}></Player>
      <Button onClick={()=> getAllVideos(course)}>View All Videos</Button>
    </div>
  ));
}

export default DisplayCourses;
