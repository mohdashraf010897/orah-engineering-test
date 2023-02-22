import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { Spacing } from "shared/styles/styles"
import { Activity } from "shared/models/activity"
import { useApi } from "shared/hooks/use-api"
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Tooltip } from "@material-ui/core"
import { Person } from "shared/models/person"

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

type Order = "asc" | "desc"

function getComparator<Key extends keyof any>(order: Order, orderBy: Key): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
  return order === "desc" ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy)
}

// Since 2020 all major browsers ensure sort stability with Array.prototype.sort().
// stableSort() brings sort stability to non-modern browsers (notably IE11). If you
// only support modern browsers you can replace stableSort(exampleArray, exampleComparator)
// with exampleArray.slice().sort(exampleComparator)
function stableSort<T>(array: readonly T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) {
      return order
    }
    return a[1] - b[1]
  })
  return stabilizedThis.map((el) => el[0])
}

interface Data {
  completed_at: number
  name: string
  present: number
  late: number
  absent: number
}

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof Data) => void
  order: Order
  orderBy: string
  rowCount: number
}

interface HeadCell {
  disablePadding: boolean
  id: keyof Data
  label: string
  numeric: boolean
}

const headCells: readonly HeadCell[] = [
  {
    id: "completed_at",
    numeric: false,
    disablePadding: false,
    label: "Date",
  },
  {
    id: "name",
    numeric: false,
    disablePadding: false,
    label: "Roll Name",
  },
  {
    id: "present",
    numeric: true,
    disablePadding: false,
    label: "Present",
  },
  {
    id: "late",
    numeric: true,
    disablePadding: false,
    label: "Late",
  },
  {
    id: "absent",
    numeric: true,
    disablePadding: false,
    label: "Absent",
  },
]

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, onRequestSort } = props
  const createSortHandler = (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property)
  }

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : "asc"} onClick={createSortHandler(headCell.id)}>
              {headCell.label}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  )
}

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [getActivities, activitiesData, activitiesLoadState] = useApi<{ activity: Activity[] }>({ url: "get-activities" })
  const [getStudents, data, loadState] = useApi<{ students: Person[] }>({ url: "get-homeboard-students" })
  const [studentsNameMap, setStudentsNameMap] = useState<{ [key: number]: string }>()

  const [order, setOrder] = React.useState<Order>("asc")
  const [orderBy, setOrderBy] = React.useState<keyof Data>("present")

  useEffect(() => {
    getActivities()
  }, [getActivities])

  useEffect(() => {
    getStudents()
  }, [getStudents])

  useEffect(() => {
    if (loadState === "loaded") {
      const map: { [key: number]: string } = {}
      data!.students.forEach((student) => {
        map[student.id] = student.first_name + " " + student.last_name
      })

      setStudentsNameMap(map)
    }
  }, [data])

  useEffect(() => {
    if (activitiesLoadState === "loaded") {
      const activityList: Activity[] = activitiesData?.activity ?? []

      setActivities(activityList)
    }

    // Date | Roll Name | Present | Late | Absent |

    // {'roll_state': [ array of student ids]}

    // { [student_id] : <StudentName> }
  }, [activitiesData])

  function createRows() {
    return activities.map(({ entity }) => {
      const { completed_at, name, student_roll_states } = entity

      const getRollCountsByState = (): {
        present: number
        absent: number
        late: number
      } => {
        let presentStudents: number[] = [],
          absentStudents: number[] = [],
          lateStudents: number[] = []
        student_roll_states.forEach((s) => {
          switch (s.roll_state) {
            case "absent":
              absentStudents.push(s.student_id)
              break
            case "present":
              presentStudents.push(s.student_id)
              break
            case "late":
              lateStudents.push(s.student_id)
              break
            default:
              break
          }
        })

        return {
          present: presentStudents.length,
          absent: absentStudents.length,
          late: lateStudents.length,
        }
      }

      return { completed_at: new Date(completed_at).getTime(), name, ...getRollCountsByState() }
    })
  }

  const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof Data) => {
    const isAsc = orderBy === property && order === "asc"
    setOrder(isAsc ? "desc" : "asc")
    setOrderBy(property)
  }

  function renderTooltipTitle(studentsArr: number[]) {
    return (
      <ol>
        {studentsArr.map((st) => (
          <li>{studentsNameMap?.[st] ?? st}</li>
        ))}
      </ol>
    )
  }

  const rows = createRows()
  return (
    <S.Container>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <EnhancedTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} rowCount={rows.length} />
          <TableBody>
            {stableSort(rows, getComparator(order, orderBy)).map((row) => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row">
                  <Tooltip title={new Date(row.completed_at).toISOString()}>
                    <span>{new Date(row.completed_at).toLocaleDateString()}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="left">
                  <Tooltip title={<span>Roll Name - {row.name}</span>}>
                    <>{row.name}</>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <S.RoundButton variant="contained">{row.present}</S.RoundButton>
                </TableCell>
                <TableCell align="right">
                  <S.RoundButton variant="contained">{row.late}</S.RoundButton>
                </TableCell>
                <TableCell align="right">
                  <S.RoundButton variant="contained">{row.absent}</S.RoundButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </S.Container>
  )
}

const S = {
  Container: styled.div`
    display: flex;
    flex-direction: column;
    width: 50%;
    margin: ${Spacing.u4} auto 0;
  `,
  RoundButton: styled(Button)`
    && {
      border-radius: 50%;
      min-width: unset;
    }
  `,
}
