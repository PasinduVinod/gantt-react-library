import React, { useState } from 'react';

function RightClickMenu() {
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMenuVisible, setMenuVisible] = useState(false);

  const handleContextMenu = (e) => {
    e.preventDefault();

    setMenuPosition({ top: e.pageY, left: e.pageX });
    setMenuVisible(true);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  return (
    <div onContextMenu={handleContextMenu}>
      RightClickMenu

      {isMenuVisible && (
        <div
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            border: '1px solid #ccc',
            background: '#fff',
            zIndex: 1000,
          }}
          onBlur={handleMenuClose} // For handling focus loss, you might need to add more logic
        >
          {/* Add your menu items here */}
          <div onClick={handleMenuClose}>Item 1</div>
          <div onClick={handleMenuClose}>Item 2</div>
          <div onClick={handleMenuClose}>Item 3</div>
          {/* Add more items as needed */}
        </div>
      )}
    </div>
  );
}

export default RightClickMenu
