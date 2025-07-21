import React from "react";
import styled from "styled-components";

export interface TeamMemberActionsCardProps {
  onInfo: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const TeamMemberActionsCard: React.FC<TeamMemberActionsCardProps> = ({ onInfo, onDelete, onClose }) => {
  return (
    <StyledWrapper>
      <div className="card">
        <ul className="list">
          <li className="element" onClick={onInfo}>
            <svg xmlns="http://www.w3.org/2000/svg" width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="#7e8590" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <p className="label">Info</p>
          </li>
          <li className="element delete" onClick={onDelete}>
            <svg className="lucide lucide-trash-2" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#7e8590" fill="none" viewBox="0 0 24 24" height={24} width={24} xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line y2={17} y1={11} x2={10} x1={10}/><line y2={17} y1={11} x2={14} x1={14}/></svg>
            <p className="label">Delete</p>
          </li>
        </ul>
        <div className="separator" />
        <ul className="list">
          <li className="element" onClick={onClose}>
            <svg className="lucide lucide-x" strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} stroke="#7e8590" fill="none" viewBox="0 0 24 24" height={24} width={24} xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <p className="label">Close</p>
          </li>
        </ul>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    width: 200px;
    background-color: rgba(36, 40, 50, 0.98); /* keep card color, but no white */
    background-image: linear-gradient(
      139deg,
      rgba(36, 40, 50, 0.98) 0%,
      rgba(36, 40, 50, 0.98) 0%,
      rgba(37, 28, 40, 0.98) 100%
    );
    border-radius: 12px;
    box-shadow: 0 4px 32px 0 rgba(0,0,0,0.18);
    padding: 15px 0px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    /* Remove any border or outline that could look white */
    border: none;
  }
  .card .separator {
    border-top: 1.5px solid #42434a;
  }
  .card .list {
    list-style-type: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0px 10px;
  }
  .card .list .element {
    display: flex;
    align-items: center;
    color: #7e8590;
    gap: 10px;
    transition: all 0.3s ease-out;
    padding: 4px 7px;
    border-radius: 6px;
    cursor: pointer;
  }
  .card .list .element svg {
    width: 19px;
    height: 19px;
    transition: all 0.3s ease-out;
  }
  .card .list .element .label {
    font-weight: 600;
  }
  .card .list .element:hover {
    background-color: #5353ff;
    color: #ffffff;
    transform: translate(1px, -1px);
  }
  .card .list .delete:hover {
    background-color: #8e2a2a;
  }
  .card .list .element:active {
    transform: scale(0.99);
  }
  .card .list:not(:last-child) .element:hover svg {
    stroke: #ffffff;
  }
  .card .list:last-child svg {
    stroke: #bd89ff;
  }
  .card .list:last-child .element {
    color: #bd89ff;
  }
  .card .list:last-child .element:hover {
    background-color: rgba(56, 45, 71, 0.836);
  }
`;

export default TeamMemberActionsCard;
