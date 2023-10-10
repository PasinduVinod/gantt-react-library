import React, { useState } from "react";

const PopupOrders = () => {
  const [data, setData] = useState([
    {"oID":"O001", "cutomerID":"C001", "customerName":"Benji", "pieces": 10000, "deadline":"2023/10/15"},
    {"oID":"O002", "cutomerID":"C002", "customerName":"Alpha", "pieces": 8000, "deadline":"2023/10/19"},
    {"oID":"O003", "cutomerID":"C001", "customerName":"Benji", "pieces": 9000, "deadline":"2023/10/23"},
    {"oID":"O004", "cutomerID":"C001", "customerName":"Benji", "pieces": 12000, "deadline":"2023/10/25"},
    {"oID":"O005", "cutomerID":"C002", "customerName":"Alpha", "pieces": 18000, "deadline":"2023/10/30"}
  ]);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [border, setBorder] = useState("solid 0px black");

  const openPopup = () => {
    setIsPopupOpen(true);
    setBorder("solid 3px black");
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const Popup = () => {
    // Render the popup content here
    return <div style={{width:"40%",height:"auto", border:border, margin:"100px auto"}}>
      <table style={{width:"100%"}}> 
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer ID</th>
            <th>Customer Name</th>
            <th>Pieces</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody>
          {data.map((order) => (
            <tr key={order.oID} style={{cursor:"pointer"}} onClick={() => copyRowData(order)}>
              <td>{order.oID}</td>
              <td>{order.cutomerID}</td>
              <td>{order.customerName}</td>
              <td>{order.pieces}</td>
              <td>{order.deadline}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>;
  };

  const copyRowData = (row) => {
    // Copy the row data to the clipboard
    navigator.clipboard.writeText(JSON.stringify(row));

    // Close the popup
    closePopup();    
  };

  return (
    <div style={{}}>
      <button onClick={openPopup}>Orders</button>
      {isPopupOpen && <Popup />}
    </div>
  );
};

export default PopupOrders;
