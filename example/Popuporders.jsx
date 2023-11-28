import React, { useState, useEffect } from "react";

const PopupOrders = () => {
  const [data, setData] = useState([
    {"oID":"O001", "cutomerID":"C001", "customerName":"Benji", "pieces": 9000, smv:10, "deadline":"2023-11-29"},
    {"oID":"O002", "cutomerID":"C002", "customerName":"Alpha", "pieces": 8000, smv:10, "deadline":"2023-12-1"},
    {"oID":"O003", "cutomerID":"C001", "customerName":"Benji", "pieces": 100, smv:20, "deadline":"2023-10-3"},
    {"oID":"O004", "cutomerID":"C001", "customerName":"Benji", "pieces": 12000, smv:15, "deadline":"2023-12-25"},
    {"oID":"O005", "cutomerID":"C002", "customerName":"Alpha", "pieces": 18000, smv:10, "deadline":"2023-11-21"}
  ]);3

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);

  const openPopup = () => {
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const TooltipOrders = () => {
    if (!tooltipData) return null;

    const { left, top } = tooltipData.position;
    const { oID, cutomerID, customerName, pieces, deadline } = tooltipData.data;

    return (
      <div
        style={{
          position: "fixed",
          left: left + 10,
          top: top + 10,
          backgroundColor: "#d6d6d6",
          color: "#fff",
          padding: "10px",
          border: "2px solid #dedede",
          borderRadius: "5px",
          zIndex: 999,
        }}
      >
        <p><strong>Order ID:</strong> {oID}</p>
        <p><strong>Customer ID:</strong> {cutomerID}</p>
        <p><strong>Customer Name:</strong> {customerName}</p>
        <p><strong>Pieces:</strong> {pieces}</p>
        <p><strong>Deadline:</strong> {deadline}</p>
      </div>
    );
  };

  // Function to close the tooltip
  const closeTooltip = () => {
    setTooltipData(null);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (tooltipData) {
        setTooltipData((prev) => ({ ...prev, position: { left: e.clientX, top: e.clientY } }));
      }
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [tooltipData]);




  const copyRowData = (row, e) => {
    // Get mouse position
    const position = { left: e.clientX, top: e.clientY };

    // Set tooltip data and position
    setTooltipData({ data: row, position });

    // Copy the row data to the clipboard
    navigator.clipboard.writeText(JSON.stringify(row));

    closePopup();
    
    // Run closeTooltip after 30 seconds
    setTimeout(() => {
      closeTooltip();
    }, 10000);
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={openPopup}>Orders</button>
      {isPopupOpen && (
        <div>
          <table style={{ width: "100%" }}>
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
                <tr
                  key={order.oID}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => copyRowData(order, e)}
                >
                  <td>{order.oID}</td>
                  <td>{order.cutomerID}</td>
                  <td>{order.customerName}</td>
                  <td>{order.pieces}</td>
                  <td>{order.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tooltipData && <TooltipOrders />}
    </div>
  );
};

export default PopupOrders;
