import React, { useState, useEffect } from "react"
import styled from "styled-components"
import Button from "@material-ui/core/ButtonBase"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSortAlphaDown, faSortAlphaUp } from "@fortawesome/free-solid-svg-icons"

import { Spacing, BorderRadius, FontWeight } from "shared/styles/styles"
import { Colors } from "shared/styles/colors"
import { CenteredContainer } from "shared/components/centered-container/centered-container.component"
import { Person } from "shared/models/person"
import { useApi } from "shared/hooks/use-api"
import { StudentListTile } from "staff-app/components/student-list-tile/student-list-tile.component"
import { ActiveRollOverlay, ActiveRollAction } from "staff-app/components/active-roll-overlay/active-roll-overlay.component"
import { useDebounce } from "shared/hooks/use-debounce"

const SORT_BY_OPTIONS = [
  { label: "First name", value: "first_name" },
  { label: "Last name", value: "last_name" },
]

export const HomeBoardPage: React.FC = () => {
  const [isRollMode, setIsRollMode] = useState(false)
  const [sortBy, setSortBy] = useState<string>(SORT_BY_OPTIONS[0].value)
  const [filteredStudents, setFilteredStudents] = useState<Person[]>([])
  const [sortAsc, setSortAsc] = useState(true)
  const [getStudents, data, loadState] = useApi<{ students: Person[] }>({ url: "get-homeboard-students" })

  useEffect(() => {
    void getStudents()
  }, [getStudents])

  useEffect(() => {
    if (loadState === "loaded") {
      const studentsList: Person[] = data!.students
      setFilteredStudents(studentsList)
    }
  }, [data])

  const debouncedSearch = useDebounce((term: string) => {
    const filtered = data?.students.filter(
      (user: Person) => (user as any)["first_name"].toLowerCase().includes(term.toLowerCase()) || (user as any)["last_name"].toLowerCase().includes(term.toLowerCase())
    )
    setFilteredStudents(filtered ?? [])
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

  const sortedUsers = filteredStudents.sort((a, b) => {
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
              <StudentListTile key={s.id} isRollMode={isRollMode} student={s} />
            ))}
          </>
        )}

        {loadState === "error" && (
          <CenteredContainer>
            <div>Failed to load</div>
          </CenteredContainer>
        )}
      </S.PageContainer>
      <ActiveRollOverlay isActive={isRollMode} onItemClick={onActiveRollAction} />
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
      <div>
        <label>Sort by:</label>
        <select value={sortBy} onChange={(e) => onItemClick("sort", e.target.value)}>
          {SORT_BY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button onClick={handleSortToggle}>{sortAsc ? <FontAwesomeIcon icon={faSortAlphaDown} /> : <FontAwesomeIcon icon={faSortAlphaUp} />}</button>
      </div>
      <div>
        <input type="text" placeholder="Search by name" onChange={handleSearch} />
      </div>
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
}
