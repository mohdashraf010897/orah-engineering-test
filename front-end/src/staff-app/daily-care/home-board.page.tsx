import React, { useState, useEffect } from "react"
import styled from "styled-components"
import Button from "@material-ui/core/ButtonBase"
import Input from "@material-ui/core/InputBase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSortAlphaDown, faSortAlphaUp, faSearch } from "@fortawesome/free-solid-svg-icons"

import { Spacing, BorderRadius, FontWeight } from "shared/styles/styles"
import { Colors } from "shared/styles/colors"
import { CenteredContainer } from "shared/components/centered-container/centered-container.component"
import { Person } from "shared/models/person"
import { useApi } from "shared/hooks/use-api"
import { StudentListTile } from "staff-app/components/student-list-tile/student-list-tile.component"
import { ActiveRollOverlay, ActiveRollAction } from "staff-app/components/active-roll-overlay/active-roll-overlay.component"
import { useDebounce } from "shared/hooks/use-debounce"
import { Select } from "@material-ui/core"
import { RollInput, RolllStateType } from "shared/models/roll"

const SORT_BY_OPTIONS = [
  { label: "First name", value: "first_name" },
  { label: "Last name", value: "last_name" },
]

type studentsState = { [key: number]: Person }

export const HomeBoardPage: React.FC = () => {
  const [isRollMode, setIsRollMode] = useState(false)
  const [sortBy, setSortBy] = useState<string>(SORT_BY_OPTIONS[0].value)
  const [filteredStudents, setFilteredStudents] = useState<studentsState>({})
  const [sortAsc, setSortAsc] = useState(true)
  const [getStudents, data, loadState] = useApi<{ students: Person[] }>({ url: "get-homeboard-students" })
  const [attendance, setAttendance] = useState<RollInput>({ student_roll_states: [] })
  const [selectedRollState, setSelectedRollState] = useState<RolllStateType | "all" | undefined>()

  useEffect(() => {
    void getStudents()
  }, [getStudents])

  useEffect(() => {
    if (loadState === "loaded") {
      const studentsList: Person[] = data!.students

      const newStudentsObject: studentsState = {}
      studentsList.forEach((st) => {
        newStudentsObject[st.id] = { ...st }
      })
      setFilteredStudents(newStudentsObject)
    }
  }, [data, selectedRollState])

  const debouncedSearch = useDebounce((term: string) => {
    const filtered = data?.students.filter(
      (user: Person) => (user as any)["first_name"].toLowerCase().includes(term.toLowerCase()) || (user as any)["last_name"].toLowerCase().includes(term.toLowerCase())
    )
    if (filtered) {
      const newFilteredStudentsObject: studentsState = {}
      filtered.forEach((st) => {
        newFilteredStudentsObject[st.id] = { ...st }
      })
      setFilteredStudents(newFilteredStudentsObject)
    }
  }, 300)

  const onToolbarAction = (action: ToolbarAction, value?: string) => {
    if (action === "roll") {
      setIsRollMode(true)
    } else if (action === "sort" && value) {
      handleSortByChange(value)
    }
  }

  const handleSortByChange = (value: string) => {
    setSortBy(value)
  }

  const onActiveRollAction = (action: ActiveRollAction) => {
    if (action === "exit") {
      setIsRollMode(false)
    }
  }

  const filterByRollState = (students: studentsState) => {
    if (!selectedRollState || selectedRollState === "all" || selectedRollState === "unmark") return students

    if (selectedRollState) {
      const finalStudents: studentsState = {}

      attendance.student_roll_states.forEach((t) => {
        if (t.roll_state === selectedRollState) {
          finalStudents[t.student_id] = filteredStudents[t.student_id]
        }
      })

      return finalStudents
    }
  }

  const sortedUsers = Object.values(filterByRollState(filteredStudents) ?? {}).sort((a, b) => {
    const aVal = sortBy === SORT_BY_OPTIONS[0].value ? a.first_name : a.last_name
    const bVal = sortBy === SORT_BY_OPTIONS[0].value ? b.first_name : b.last_name
    if (aVal < bVal) {
      return sortAsc ? -1 : 1
    }
    if (aVal > bVal) {
      return sortAsc ? 1 : -1
    }
    return 0
  })

  return (
    <>
      <S.PageContainer>
        <Toolbar onItemClick={onToolbarAction} sortBy={sortBy} handleSortToggle={() => setSortAsc((prev: boolean) => !prev)} sortAsc={sortAsc} handleSearchCB={debouncedSearch} />

        {loadState === "loading" && (
          <CenteredContainer>
            <FontAwesomeIcon icon="spinner" size="2x" spin />
          </CenteredContainer>
        )}

        {loadState === "loaded" && sortedUsers && (
          <>
            {sortedUsers.map((s) => (
              <StudentListTile key={s.id} isRollMode={isRollMode} student={s} attendance={attendance} setAttendance={setAttendance} />
            ))}
          </>
        )}

        {loadState === "error" && (
          <CenteredContainer>
            <div>Failed to load</div>
          </CenteredContainer>
        )}
      </S.PageContainer>
      <ActiveRollOverlay
        isActive={isRollMode}
        onItemClick={onActiveRollAction}
        attendance={attendance}
        setSelectedRollState={setSelectedRollState}
        totalStudents={Object.keys(filteredStudents).length}
      />
    </>
  )
}

type ToolbarAction = "roll" | "sort"
interface ToolbarProps {
  onItemClick: (action: ToolbarAction, value?: string) => void
  sortBy: string
  sortAsc: boolean
  handleSortToggle: () => void
  handleSearchCB: (value: string) => void
}
const Toolbar: React.FC<ToolbarProps> = (props) => {
  const { onItemClick, sortBy, sortAsc, handleSortToggle, handleSearchCB } = props
  const [searchTerm, setSearchTerm] = useState("")
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    handleSearchCB(term)
  }
  return (
    <S.ToolbarContainer>
      <S.SortWrapper>
        <label>Sort by:</label>
        <Select value={sortBy} onChange={(e: React.ChangeEvent<{ name?: string | undefined; value: unknown }>) => onItemClick("sort", e.target.value as string)}>
          {SORT_BY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <button onClick={handleSortToggle}>{sortAsc ? <FontAwesomeIcon icon={faSortAlphaDown} /> : <FontAwesomeIcon icon={faSortAlphaUp} />}</button>
      </S.SortWrapper>
      <S.InputWrapper>
        <div style={{ marginRight: "10px" }}>
          <FontAwesomeIcon icon={faSearch} />
        </div>
        <S.Input type="text" placeholder="Search by name" onChange={handleSearch} value={searchTerm} />
      </S.InputWrapper>
      <S.Button onClick={() => onItemClick("roll")}>Start Roll</S.Button>
    </S.ToolbarContainer>
  )
}

const S = {
  PageContainer: styled.div`
    display: flex;
    flex-direction: column;
    width: 50%;
    margin: ${Spacing.u4} auto 140px;
  `,
  ToolbarContainer: styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;
    background-color: ${Colors.blue.base};
    padding: 6px 14px;
    font-weight: ${FontWeight.strong};
    border-radius: ${BorderRadius.default};
  `,
  Button: styled(Button)`
    && {
      padding: ${Spacing.u2};
      font-weight: ${FontWeight.strong};
      border-radius: ${BorderRadius.default};
    }
  `,
  Input: styled(Input)`
    && {
      color: white;
      width: 120px;
    }
  `,
  InputWrapper: styled("div")`
    border-bottom: 1px solid white;
    border-radius: 0;
    display: flex;
    align-items: center;
  `,
  SortWrapper: styled("div")`
    display: flex;
    align-items: center;
    cursor: default;
    label {
      margin-right: 10px;
    }

    .MuiSelect-icon {
      color: white;
    }
    .MuiSelect-select,
    .MuiSelect-nativeInput {
      color: white;
      border-color: white;
      cursor: pointer;
    }

    .MuiInput-underline {
      border-bottom: 0.5px solid white !important;
      &:before {
        border-bottom: 1px solid white !important;
      }
    }

    button {
      height: 31px;
      cursor: pointer;
    }
  `,
}
