import React, { useEffect, useState } from "react"
import styled from "styled-components"
import { Spacing } from "shared/styles/styles"
import { Activity } from "shared/models/activity"
import { useApi } from "shared/hooks/use-api"
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@material-ui/core"
import { Person } from "shared/models/person"

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [getActivities, activitiesData, activitiesLoadState] = useApi<{ activity: Activity[] }>({ url: "get-activities" })
  const [getStudents, data, loadState] = useApi<{ students: Person[] }>({ url: "get-homeboard-students" })
  const [studentsNameMap, setStudentsNameMap] = useState<{ [key: number]: string }>()

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
        present: { count: Number; students: number[] }
        absent: { count: Number; students: number[] }
        late: { count: Number; students: number[] }
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
          present: {
            count: presentStudents.length,
            students: presentStudents,
          },
          absent: {
            count: absentStudents.length,
            students: absentStudents,
          },
          late: {
            count: lateStudents.length,
            students: lateStudents,
          },
        }
      }

      return { completed_at, name, ...getRollCountsByState() }
    })
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

  return (
    <S.Container>
      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell align="right">Roll Name</TableCell>
              <TableCell align="right">Present</TableCell>
              <TableCell align="right">Late</TableCell>
              <TableCell align="right">Absent</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {createRows().map((row) => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row">
                  <Tooltip title={new Date(row.completed_at).toISOString()}>
                    <span>{new Date(row.completed_at).toLocaleDateString()}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={<span>Roll Name - {row.name}</span>}>
                    <>{row.name}</>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip disableHoverListener={!row.present.count} title={renderTooltipTitle(row.present.students)}>
                    <S.RoundButton variant="contained">{row.present.count}</S.RoundButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip disableHoverListener={!row.late.count} title={renderTooltipTitle(row.late.students)}>
                    <S.RoundButton variant="contained">{row.late.count}</S.RoundButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip disableHoverListener={!row.absent.count} title={renderTooltipTitle(row.absent.students)}>
                    <S.RoundButton variant="contained">{row.absent.count}</S.RoundButton>
                  </Tooltip>
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
