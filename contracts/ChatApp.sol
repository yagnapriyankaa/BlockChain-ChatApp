// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ChatApp {
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
    }

    // Mapping to store messages received by each user
    mapping(address => Message[]) private messages;

    // Event emitted when a message is sent
    event MessageSent(address indexed from, address indexed to, string content, uint256 timestamp);

    /// @notice Send a message to another user
    /// @param to Recipient's address
    /// @param content The message content
    function sendMessage(address to, string calldata content) external {
        require(to != address(0), "Invalid recipient address");
        require(bytes(content).length > 0, "Message cannot be empty");

        Message memory newMessage = Message({
            sender: msg.sender,
            content: content,
            timestamp: block.timestamp
        });

        messages[to].push(newMessage);

        emit MessageSent(msg.sender, to, content, block.timestamp);
    }

    /// @notice Retrieve all messages sent to the caller
    /// @return Array of Message structs
    function getMessages() external view returns (Message[] memory) {
        return messages[msg.sender];
    }
}
