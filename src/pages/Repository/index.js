import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import parse from 'parse-link-header';

import {
  Loading,
  Owner,
  IssueList,
  IssueLabel,
  IssueFilter,
  IssuePagination,
} from './styles';
import api from '../../services/api';
import Container from '../../components/Container';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repoName: '',
    navButtons: { prev: '<', next: '>' },
    repository: {},
    issues: [],
    pageCount: 1,
    lastPage: false,
    loading: true,
    filters: ['open', 'closed', 'all'],
    filterIndex: 0,
    page: 1,
  };

  // Load repositories data
  async componentDidMount() {
    const { filters, filterIndex, page } = this.state;
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues?page=${page}`, {
        params: {
          state: filters[filterIndex],
          per_page: 5,
        },
      }),
    ]);

    // Get headers to check last page, if has next or previous
    const issueHeader = parse(issues.headers.link);

    this.setState({
      repoName,
      repository: repository.data,
      issues: issues.data,
      pageCount: issueHeader.last ? issueHeader.last.page : page,
      lastPage: !issueHeader.last,
      loading: false,
    });
  }

  // Reload issues based on filter, pagination, ...
  getIssues = async () => {
    const { repoName, filters, filterIndex, page } = this.state;

    const issues = await api.get(`/repos/${repoName}/issues?page=${page}`, {
      params: {
        state: filters[filterIndex],
        per_page: 5,
      },
    });

    // Get headers to check last page, if has next or previous
    const issueHeader = parse(issues.headers.link);

    this.setState({
      issues: issues.data,
      pageCount: issueHeader.last ? issueHeader.last.page : page,
      lastPage: !issueHeader.last,
      loading: false,
    });
  };

  // Filter buttons action
  handleFilter = async e => {
    await this.setState({ filterIndex: +e.target.value, page: 1 });
    this.getIssues();
  };

  // Navigation buttons action
  handleNavigation = async e => {
    const { navButtons, page } = this.state;
    await this.setState({
      page: e.target.textContent === navButtons.prev ? page - 1 : page + 1,
    });
    this.getIssues();
  };

  render() {
    const {
      navButtons,
      repository,
      issues,
      pageCount,
      lastPage,
      loading,
      filters,
      filterIndex,
      page,
    } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <IssueFilter active={filterIndex}>
            {filters.map((filter, index) => (
              <button
                type="button"
                key={filter}
                value={index}
                onClick={this.handleFilter}
              >
                {filter}
              </button>
            ))}
          </IssueFilter>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {issue.title}
                  </a>
                  {issue.labels.map(label => (
                    <IssueLabel
                      key={String(label.id)}
                      background={`#${label.color}`}
                    >
                      {label.name}
                    </IssueLabel>
                  ))}
                  <p>{issue.user.login}</p>
                </strong>
              </div>
            </li>
          ))}
        </IssueList>
        <IssuePagination>
          <button
            type="button"
            disabled={page < 2}
            onClick={this.handleNavigation}
          >
            {navButtons.prev}
          </button>
          <span>
            Página {page} de {pageCount}
          </span>
          <button
            type="button"
            disabled={lastPage}
            onClick={this.handleNavigation}
          >
            {navButtons.next}
          </button>
        </IssuePagination>
      </Container>
    );
  }
}
