import React, { useEffect } from "react"
import styled from "styled-components"
import Button from "@material-ui/core/Button"
import { BorderRadius, Spacing } from "shared/styles/styles"
import { RollStateList, StateList } from "staff-app/components/roll-state/roll-state-list.component"
import { RollInput, RolllStateType } from "shared/models/roll"
import { useApi } from "shared/hooks/use-api"
import { Activity } from "shared/models/activity"

export type ActiveRollAction = "filter" | "exit"
interface Props {
  isActive: boolean
  onItemClick: (action: ActiveRollAction, value?: string) => void
  attendance: RollInput
  setSelectedRollState: (action: RolllStateType | "all") => void
  totalStudents: Number
}

const ATTENDANCE_TYPES = ["all", "present", "late", "absent"]

export const ActiveRollOverlay: React.FC<Props> = (props) => {
  const { isActive, onItemClick, attendance, setSelectedRollState, totalStudents } = props

  const getStateList = (attendanceParam: RollInput): StateList[] => {
    return ATTENDANCE_TYPES.map((t: string) => ({
      type: t,
      count: attendanceParam.student_roll_states.filter((item) => (t === "all" ? true : item.roll_state === t)).length,
    })) as StateList[]
  }

  const [saveRollApi, data, loadState] = useApi<{ students: Activity[] }>({ url: "save-roll" })
  const saveRollState = () => {
    saveRollApi(attendance).then((res) => console.log({ res }))
  }

  useEffect(() => {
    console.log({ data })
  }, [data])

  return (
    <S.Overlay isActive={isActive}>
      <S.Content>
        <div>Class Attendance</div>
        <div>
          <RollStateList stateList={getStateList(attendance)} totalStudents={totalStudents} onItemClick={setSelectedRollState} />
          <div style={{ marginTop: Spacing.u6 }}>
            <Button color="inherit" onClick={() => onItemClick("exit")}>
              Exit
            </Button>
            <Button color="inherit" style={{ marginLeft: Spacing.u2 }} onClick={saveRollState}>
              Complete
            </Button>
          </div>
        </div>
      </S.Content>
    </S.Overlay>
  )
}

const S = {
  Overlay: styled.div<{ isActive: boolean }>`
    position: fixed;
    bottom: 0;
    left: 0;
    height: ${({ isActive }) => (isActive ? "120px" : 0)};
    width: 100%;
    background-color: rgba(34, 43, 74, 0.92);
    backdrop-filter: blur(2px);
    color: #fff;
  `,
  Content: styled.div`
    display: flex;
    justify-content: space-between;
    width: 52%;
    height: 100px;
    margin: ${Spacing.u3} auto 0;
    border: 1px solid #f5f5f536;
    border-radius: ${BorderRadius.default};
    padding: ${Spacing.u4};
  `,
}
